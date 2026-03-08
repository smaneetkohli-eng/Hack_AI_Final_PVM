import { NextRequest } from "next/server";
import { callClaudeWithHistory } from "@/lib/anthropic";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { action, nodeLabel, nodeDescription, keyTopics, skillName } = body;

  if (action === "explain") {
    const systemPrompt = `You are an expert tutor. Provide a clear, engaging explanation of the following concept as part of a learning roadmap for "${skillName}". Write 2-4 paragraphs covering:
1. What this concept is and why it matters
2. The core ideas and how they work
3. How it connects to other concepts in the field
4. Practical tips or real-world examples

Write at a level appropriate for someone learning this topic. Be specific and concrete, avoiding vague generalities.`;

    const userMessage = `Explain: ${nodeLabel}
${nodeDescription ? `\nContext: ${nodeDescription}` : ""}
${keyTopics?.length ? `\nKey topics to cover: ${keyTopics.join(", ")}` : ""}`;

    const stream = await callClaudeWithHistory(systemPrompt, [
      { role: "user", content: userMessage },
    ]);

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response("Unknown action", { status: 400 });
}
