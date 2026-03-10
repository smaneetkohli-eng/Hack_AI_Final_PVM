import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { callClaude } from "@/lib/anthropic";
import { isVerifiedSource, isAutoApproveDomain } from "@/config/trustedSources";
import { recalculateStatuses } from "@/lib/roadmapUtils";
import type { DBNode } from "@/types";

const URL_REGEX = /https?:\/\/[^\s]+/gi;

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { skillId, message, skillName, activeNodeLabel, nodes } = body;

  const nodeList = (nodes || []) as { id: string; label: string; node_key: string; module_order?: number }[];

  // Try add_module: user wants to add new module(s) to the roadmap
  const addModuleMatch = (message as string).match(
    /(?:add|create|want to add).*?(?:module|roadmap)/i
  );
  if (
    addModuleMatch &&
    skillId &&
    !(message as string).match(/https?:\/\//)
  ) {
    try {
      const modulesJson = await callClaude(
        `You are an expert curriculum designer. The user wants to ADD new modules to their existing learning roadmap.

Given their request and the current roadmap, output a JSON array of new modules to add. Each module must have:
- label: string (clear topic name)
- description: string (2-3 sentences)
- estimatedTime: string (e.g. "2-3 hours")
- keyTopics: string[] (3-5 subtopics)
- prerequisites: string[] (EXACT node_key values from existingNodes - modules this depends on. Use [] for foundation topics.)
- placeAfter: string | null (label of existing module to place this after, for ordering; null = put early)

Fit new modules logically into the roadmap. Match the skill domain. Use existing node_keys for prerequisites.
Return ONLY valid JSON array, no markdown, no explanation.`,
        `Skill: ${skillName || "Unknown"}

Existing roadmap (node_key, label, module_order):
${
  nodeList.length > 0
    ? nodeList
        .sort((a, b) => (a.module_order ?? 0) - (b.module_order ?? 0))
        .map((n) => `  ${n.node_key}: "${n.label}" (order ${n.module_order ?? 0})`)
        .join("\n")
    : "  (empty - these will be the first modules)"
}

User request: ${message}

Output the JSON array of new modules to add. Use [] for prerequisites when adding to an empty roadmap.`
      );

      const cleaned = modulesJson
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const newModules = JSON.parse(cleaned) as Array<{
        label: string;
        description: string;
        estimatedTime: string;
        keyTopics: string[];
        prerequisites?: string[];
        placeAfter?: string | null;
      }>;

      if (!Array.isArray(newModules) || newModules.length === 0) {
        return NextResponse.json({
          message: "Couldn't parse the modules to add. Try being more specific.",
        });
      }

      const maxOrder = Math.max(
        ...nodeList.map((n) => n.module_order ?? 0),
        0
      );
      const labelToKey = new Map(
        nodeList.map((n) => [n.label.toLowerCase(), n.node_key])
      );
      const inserted: { id: string; node_key: string; label: string; module_order: number }[] = [];

      for (let i = 0; i < newModules.length; i++) {
        const mod = newModules[i];
        const prereqs = mod.prerequisites || [];
        const prereqKeys = prereqs
          .map((p) => {
            const asKey = nodeList.find((n) => n.node_key === p)?.node_key;
            if (asKey) return asKey;
            const byLabel = labelToKey.get(String(p).toLowerCase());
            return byLabel ?? null;
          })
          .filter(Boolean) as string[];
        const nodeKey = `module_add_${Date.now()}_${i}`;
        const hasPrereqs = prereqKeys.length > 0;

        const { data: insertedNode, error } = await supabase
          .from("nodes")
          .insert({
            skill_id: skillId,
            node_key: nodeKey,
            label: mod.label,
            description: mod.description || null,
            tier: null,
            estimated_time: mod.estimatedTime || "1-2 hours",
            key_topics: mod.keyTopics || [],
            prerequisites: hasPrereqs ? prereqKeys : null,
            status: hasPrereqs ? "locked" : "available",
            position_x: null,
            position_y: null,
            ai_explanation: null,
            module_order: maxOrder + 1 + i,
            resource_counts: {
              lessons: 2,
              exercises: 1,
              projects: 0,
              readings: 1,
            },
          })
          .select("id, node_key, label, module_order")
          .single();

        if (error) {
          console.error("Insert node error:", error);
          return NextResponse.json({
            message: `Added ${inserted.map((n) => n.label).join(", ")}. Failed on "${mod.label}": ${error.message}`,
          });
        }
        if (insertedNode) inserted.push(insertedNode as typeof inserted[0]);
      }

      const { data: allNodes } = await supabase
        .from("nodes")
        .select("*")
        .eq("skill_id", skillId)
        .order("module_order", { ascending: true });

      const recalculated = recalculateStatuses((allNodes || []) as DBNode[]);
      for (const n of recalculated) {
        await supabase
          .from("nodes")
          .update({ status: n.status })
          .eq("id", n.id);
      }

      const labels = inserted.map((n) => n.label).join(", ");
      return NextResponse.json({
        message: `Done. Added ${labels} to your roadmap.`,
        nodes: recalculated,
      });
    } catch (err) {
      console.error("Agent add_module error:", err);
      return NextResponse.json({
        message:
          "Couldn't add the modules. Try: \"Add a module for [topic]\" or \"Add modules for X and Y\".",
      });
    }
  }

  // Extract URLs from message
  const urls = (message as string).match(URL_REGEX) || [];
  const firstUrl = urls[0]?.trim();

  // Try add_source: user wants to add a source to a module
  const addSourcePatterns = [
    /add\s+(?:this\s+)?(?:source|link|url|resource)\s+to\s+(.+)/i,
    /add\s+(.+)\s+to\s+(.+)/i,
    /(?:i\s+want\s+to\s+)?add\s+(?:this\s+)?(?:source|link)\s+to\s+(?:this\s+)?(?:module|topic)\s*[:\.]?\s*(.+)/i,
    /(?:put|add)\s+(.+?)\s+in\s+(.+)/i,
    /add\s+to\s+(.+)/i,
  ];

  let targetLabel: string | null = null;

  for (const pattern of addSourcePatterns) {
    const match = (message as string).match(pattern);
    if (match) {
      const lastGroup = match[match.length - 1];
      targetLabel = lastGroup?.replace(/^["']|["']$/g, "").trim() || null;
      break;
    }
  }

  // Fallback: if we have a URL and nodes, use active node or first module
  if (firstUrl && !targetLabel && nodes?.length) {
    targetLabel = activeNodeLabel || (nodes[0] as { label: string }).label;
  }

  if (firstUrl && targetLabel && skillId && nodes?.length) {
    const nodeList = nodes as { id: string; label: string; node_key: string }[];
    const match = findBestNodeMatch(targetLabel, nodeList);

    if (match) {
      try {
        const hostname = new URL(firstUrl).hostname.replace("www.", "");
        const isVideo =
          firstUrl.includes("youtube.com") || firstUrl.includes("youtu.be");
        const autoApprove = isAutoApproveDomain(firstUrl);

        let title: string = firstUrl;
        let type: string = isVideo ? "video" : "article";
        let sourceName: string = hostname;

        if (autoApprove) {
          // Known platform - skip Claude evaluation, infer metadata from URL
          if (isVideo) {
            sourceName = "YouTube";
            title = `${match.label} - YouTube Resource`;
          } else if (hostname.includes("github.com")) {
            sourceName = "GitHub";
            type = "project";
            title = `${match.label} - GitHub Resource`;
          } else if (hostname.includes("medium.com") || hostname.includes("dev.to")) {
            sourceName = hostname.includes("medium.com") ? "Medium" : "Dev.to";
            type = "article";
            title = `${match.label} - Article`;
          } else {
            title = `${match.label} - ${hostname}`;
          }

          // Try to get a better title from Claude (non-blocking, best-effort)
          try {
            const meta = await callClaude(
              `Given this URL and topic, generate a short descriptive title (max 60 chars). Return ONLY the title text, nothing else.`,
              `URL: ${firstUrl}\nTopic: ${match.label}`
            );
            const cleaned = meta.trim().replace(/^["']|["']$/g, "");
            if (cleaned.length > 3 && cleaned.length < 100) {
              title = cleaned;
            }
          } catch {
            // title fallback is fine
          }
        } else {
          // Unknown domain - use Claude evaluation with lenient prompt
          const evaluation = await callClaude(
            `You evaluate learning resource URLs. You CANNOT access URLs, so judge based on the domain name and URL structure alone.
IMPORTANT: Be lenient. If the domain looks like a legitimate website (not spam/malware), approve it.
Respond with JSON only: { "approved": boolean, "title": "string", "type": "video|article|doc", "source_name": "string" }`,
            `URL: ${firstUrl}\nTopic: ${match.label}\n\nProvide metadata for this resource.`
          );

          const cleaned = evaluation.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const result = JSON.parse(cleaned);

          if (!result.approved) {
            return NextResponse.json({
              message: `That URL looks suspicious. If you trust it, try adding it directly from the module's Resources panel.`,
            });
          }

          title = result.title || title;
          type = result.type || type;
          sourceName = result.source_name || sourceName;
        }

        await supabase.from("node_resources").insert({
          node_id: match.id,
          type: isVideo ? "video" : type,
          title,
          url: firstUrl,
          source_name: sourceName,
          is_verified: isVerifiedSource(firstUrl),
          last_fetched_at: new Date().toISOString(),
        });

        return NextResponse.json({
          message: `Done. Added "${title}" to ${match.label}.`,
          invalidateNodeId: match.id,
        });
      } catch (err) {
        console.error("Agent add_source error:", err);
        return NextResponse.json({
          message: "Failed to add the source. Make sure the URL is valid.",
        });
      }
    }

    return NextResponse.json({
      message: `Couldn't find a module matching "${targetLabel}". Available: ${nodeList.map((n) => n.label).join(", ")}`,
    });
  }

  // General question or guidance - use Claude for short responses
  const systemPrompt = `You are a concise AI agent for Tesseract. You help users with their learning roadmap.

RULES:
- Reply in 1-3 SHORT sentences max.
- For actions you cannot perform: briefly explain what the user can do instead.
- For roadmap questions: give quick, actionable advice.
- Never write long explanations.
- If asked to do something: either confirm you did it (the system handles actions) or say "Try: [specific action]".
- Be friendly but very brief.`;

  const context = skillName
    ? `Current skill: ${skillName}. Active module: ${activeNodeLabel || "none"}.`
    : "No skill selected.";

  const response = await callClaude(
    systemPrompt,
    `Context: ${context}\n\nUser: ${message}\n\nGive a brief reply.`
  );

  return NextResponse.json({
    message: response.trim() || "Done.",
  });
}

function findBestNodeMatch(
  query: string,
  nodes: { id: string; label: string; node_key: string }[]
): { id: string; label: string } | null {
  const q = query.toLowerCase().trim();
  const exact = nodes.find((n) => n.label.toLowerCase() === q);
  if (exact) return { id: exact.id, label: exact.label };

  const contains = nodes.find((n) => n.label.toLowerCase().includes(q));
  if (contains) return { id: contains.id, label: contains.label };

  const qInLabel = nodes.find((n) => q.includes(n.label.toLowerCase()));
  if (qInLabel) return { id: qInLabel.id, label: qInLabel.label };

  const fuzzy = nodes.find((n) =>
    n.label.toLowerCase().split(/\s+/).some((w) => w.startsWith(q) || q.startsWith(w))
  );
  if (fuzzy) return { id: fuzzy.id, label: fuzzy.label };

  return null;
}
