import { NextRequest } from "next/server";
import { callClaudeWithHistory } from "@/lib/anthropic";
import { createServerSupabase } from "@/lib/supabase-server";
import { fetchResourcesForNode } from "@/lib/resourceFetcher";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { nodeId, force } = await request.json();

  if (!nodeId) {
    return new Response("Missing nodeId", { status: 400 });
  }

  const { data: node } = await supabase
    .from("nodes")
    .select("id, label, description, key_topics, skill_id")
    .eq("id", nodeId)
    .single();

  if (!node) {
    return new Response("Node not found", { status: 404 });
  }

  const { data: skill } = await supabase
    .from("skills")
    .select("name")
    .eq("id", node.skill_id)
    .single();

  const skillName = skill?.name || "";

  let { data: resources } = await supabase
    .from("node_resources")
    .select("*")
    .eq("node_id", nodeId);

  if (!resources || resources.length === 0) {
    const fetched = await fetchResourcesForNode(node.label, skillName);

    const toInsert = fetched.map((r) => ({
      node_id: nodeId,
      type: r.type,
      title: r.title,
      url: r.url,
      source_name: r.source_name,
      thumbnail_url: r.thumbnail_url || null,
      duration: r.duration || null,
      description: r.description || null,
      is_verified: r.is_verified,
      last_fetched_at: new Date().toISOString(),
    }));

    if (toInsert.length > 0) {
      const { data: inserted } = await supabase
        .from("node_resources")
        .insert(toInsert)
        .select();
      resources = inserted || [];
    } else {
      resources = [];
    }
  }

  const resourceList = resources.map((r: { title: string | null; url: string | null; type: string | null }) => ({
    title: r.title || "Untitled",
    url: r.url || "",
    type: r.type || "article",
  }));

  const resourceJSON = JSON.stringify(resourceList, null, 2);

  const systemPrompt = `You are an expert learning coach creating a step-by-step study guide for a "${skillName}" learning roadmap. Your job is to break a concept into clear, actionable learning steps and weave in the best available resources.

STRICT FORMAT RULES:

1. Create 3–6 steps using ## Step N: [Short Title] headings.
2. Each step focuses on ONE mini-concept or skill.
3. Under each step, write 1–3 sentences of instruction. Embed markdown links to the most relevant resources inline using [descriptive text](url).
4. Only use URLs from the provided resource list. Do NOT invent URLs.
5. Each resource should be used at most once across all steps. Pick the best-fit resource for each step.
6. If a step is about watching a video, say so naturally: "Watch [video title](url) to see how..."
7. If a step is about reading, say: "Read [article title](url) to understand..."
8. Order steps from foundational to advanced.
9. After the last step, add a brief ## Summary section (2–3 bullet points) of what the learner should now understand.
10. If the resource list is empty, still generate helpful steps with general instructions (no links).
11. Output ONLY markdown — no preamble, no code fences.`;

  const userMessage = `Concept: ${node.label}
${node.description ? `\nDescription: ${node.description}` : ""}
${node.key_topics?.length ? `\nKey topics: ${(node.key_topics as string[]).join(", ")}` : ""}

Available resources:
${resourceJSON}`;

  const stream = await callClaudeWithHistory(systemPrompt, [
    { role: "user", content: userMessage },
  ]);

  const [saveBranch, responseBranch] = stream.tee();

  (async () => {
    const reader = saveBranch.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
      }
      if (fullText.trim()) {
        await supabase
          .from("nodes")
          .update({ ai_explanation: fullText })
          .eq("id", node.id);
      }
    } catch {
      // best-effort save
    }
  })();

  return new Response(responseBranch, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
