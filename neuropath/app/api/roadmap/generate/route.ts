import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { callClaude } from "@/lib/anthropic";
import { moduleRoadmapToDBNodes } from "@/lib/roadmapUtils";
import type { ModuleRoadmap } from "@/types";

const SYSTEM_PROMPT = `You are an expert curriculum designer and adaptive learning AI. Given a user's skill goal, scope, prior knowledge, and learning preferences, generate a structured learning roadmap as a JSON object composed of sequential learning modules.

Rules:
- Generate 6-12 modules that form a logical learning sequence
- Each module should represent a distinct, focused topic area
- Modules should progress from foundational to advanced
- Each module must include realistic resource counts
- Descriptions should be 2-3 sentences explaining what the learner will gain
- keyTopics should list 3-6 specific subtopics covered in the module
- Return ONLY valid JSON, no markdown, no explanation, no code fences

The JSON must match this exact shape:
{
  "skill": "string",
  "modules": [
    {
      "id": "string (unique, like 'module_1')",
      "order": "number (1-based sequential order)",
      "label": "string (module topic name)",
      "description": "string (2-3 sentence summary of what the learner will learn)",
      "estimatedTime": "string (e.g., '2-3 hours')",
      "keyTopics": ["array of subtopic strings, 3-6 items"],
      "resourceCounts": {
        "lessons": "number (1-8)",
        "exercises": "number (0-4)",
        "projects": "number (0-2)",
        "readings": "number (0-3)"
      }
    }
  ]
}`;

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    skillName,
    scope,
    experienceLevel,
    priorKnowledge,
    timePerWeek,
    learningStyle,
    language,
    userProfile,
  } = body;

  const userMessage = `
Skill: ${skillName}
Scope/Goal: ${scope || "General understanding"}
Experience with this topic: ${experienceLevel}
Prior knowledge: ${priorKnowledge || "None specified"}
Time per week: ${timePerWeek} hours
Learning style preference: ${learningStyle?.join(", ") || "Mixed"}
Language: ${language || "English"}
${
  userProfile
    ? `
User's field: ${userProfile.field || "Not specified"}
User's existing skills: ${userProfile.currentSkills?.join(", ") || "None"}
User's overall experience: ${userProfile.experienceLevel || "Not specified"}`
    : ""
}

Generate a personalized learning roadmap for this user.`;

  try {
    const responseText = await callClaude(SYSTEM_PROMPT, userMessage);

    let roadmap: ModuleRoadmap;
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      roadmap = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse roadmap JSON" },
        { status: 500 }
      );
    }

    const { data: skill, error: skillError } = await supabase
      .from("skills")
      .insert({
        user_id: user.id,
        name: skillName,
        scope,
        prior_knowledge: priorKnowledge,
        experience_level: experienceLevel,
        learning_preferences: { timePerWeek, learningStyle, language },
      })
      .select()
      .single();

    if (skillError || !skill) {
      return NextResponse.json(
        { error: skillError?.message || "Failed to create skill" },
        { status: 500 }
      );
    }

    const dbNodeData = moduleRoadmapToDBNodes(roadmap, skill.id);

    const { data: insertedNodes, error: nodesError } = await supabase
      .from("nodes")
      .insert(dbNodeData)
      .select();

    if (nodesError) {
      return NextResponse.json(
        { error: nodesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      skill,
      nodes: insertedNodes,
      roadmap,
    });
  } catch (error) {
    console.error("Roadmap generation error:", error);
    const errMsg = String(error);
    const isCredits = errMsg.includes("credit balance is too low");
    return NextResponse.json(
      { error: isCredits ? "Anthropic API credits depleted. Please add credits to your Anthropic account." : "Failed to generate roadmap. Please try again." },
      { status: isCredits ? 402 : 500 }
    );
  }
}
