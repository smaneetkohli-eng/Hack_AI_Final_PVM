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
    const systemPrompt = `You are an expert tutor writing structured study notes for a "${skillName}" learning roadmap. Write like concise reference notes — NOT an essay or textbook.

STRICT FORMAT RULES:

Use ## headings to break content into 3-4 sections (short titles, 2-5 words).

Under each heading, write ONE short sentence of context (max 15 words), then use bullet points for the key ideas.

Every bullet should start with a **bolded key term** followed by a dash and a brief explanation (1 sentence max).

NEVER write paragraphs longer than 2 sentences. If you catch yourself writing 3+ sentences in a row without a heading or bullet, stop and restructure.

Use ### for optional sub-sections within a section if needed.

Here is the EXACT pattern to follow:

## What It Is
Brief framing sentence.
- **Term** — one sentence explanation
- **Term** — one sentence explanation

## How It Works
Brief framing sentence.
- **Concept** — explanation
- **Concept** — explanation

Short connecting sentence if needed.

## Practical Tips
- **Tip** — actionable advice
- **Tip** — actionable advice

Be specific, concrete, and useful. Write for a learner — no fluff, no filler, no generic statements. Output ONLY markdown — no preamble.`;

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
