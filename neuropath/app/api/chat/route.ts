import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { callClaudeWithHistory } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { skillId, message, skillName, activeNodeLabel, nodeStatuses } = body;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("skill_id", skillId)
    .order("created_at", { ascending: true })
    .limit(20);

  const completedNodes = nodeStatuses
    ?.filter((n: { status: string }) => n.status === "complete" || n.status === "known")
    .map((n: { label: string }) => n.label) || [];

  const inProgressNodes = nodeStatuses
    ?.filter((n: { status: string }) => n.status === "available" || n.status === "in_progress")
    .map((n: { label: string }) => n.label) || [];

  const systemPrompt = `You are an expert AI learning adviser for Tesseract. You are helping a user learn "${skillName || "a skill"}".

${profile ? `User profile:
- Field: ${profile.field || "Not specified"}
- Experience: ${profile.experience_level || "Not specified"}
- Known skills: ${(profile.current_skills as string[])?.join(", ") || "None specified"}` : ""}

Roadmap context:
- Completed/known concepts: ${completedNodes.join(", ") || "None yet"}
- Currently available concepts: ${inProgressNodes.join(", ") || "None"}
${activeNodeLabel ? `- User is currently viewing: ${activeNodeLabel}` : ""}

Capabilities:
- Answer questions about any concept in the roadmap
- Explain concepts differently (e.g., "explain like I'm a junior dev")
- Suggest roadmap modifications
- Help the user understand when they can skip topics
- Recommend additional resources
- Generate mini-quizzes on completed topics

Be concise but thorough. Use examples. Adapt your explanation style to the user's level.`;

  const messages = [
    ...(history || []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  await supabase.from("chat_messages").insert({
    skill_id: skillId,
    user_id: user.id,
    role: "user",
    content: message,
  });

  const stream = await callClaudeWithHistory(systemPrompt, messages);

  const [streamForResponse, streamForSave] = stream.tee();

  const saveResponse = async () => {
    const reader = streamForSave.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullContent += decoder.decode(value);
    }
    await supabase.from("chat_messages").insert({
      skill_id: skillId,
      user_id: user.id,
      role: "assistant",
      content: fullContent,
    });
    await supabase.from("learning_events").insert({
      user_id: user.id,
      skill_id: skillId,
      event_type: "chat_message",
      metadata: { message_length: message.length },
    });
  };

  saveResponse().catch(console.error);

  return new Response(streamForResponse, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
