import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { callClaude } from "@/lib/anthropic";
import { moduleRoadmapToDBNodes } from "@/lib/roadmapUtils";
import type { ModuleRoadmap } from "@/types";

const SYSTEM_PROMPT = `You are an expert curriculum designer and adaptive learning AI. Given a user's skill goal, scope, prior knowledge, and learning preferences, generate a structured learning roadmap as a JSON object composed of learning modules with a BRANCHED DEPENDENCY GRAPH structure.

Rules:
- Generate 8-14 modules that form a BRANCHED dependency graph, NOT a simple linear sequence
- Structure the roadmap as a DAG (directed acyclic graph) with real prerequisite relationships
- Start with 1-2 foundational modules, then BRANCH into parallel tracks where topics are independent
- Multiple branches should CONVERGE later when advanced topics require knowledge from several areas
- A module can have 0, 1, or multiple prerequisites — use whatever is academically accurate
- Modules with no prerequisites are entry points (foundations)
- Do NOT make every module depend on only the previous one — that creates a boring linear chain
- Aim for at least 2-3 branching points and at least 1 convergence point
- Each module should represent a distinct, focused topic area
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
      "order": "number (1-based, used for display tiebreaking only)",
      "label": "string (module topic name)",
      "description": "string (2-3 sentence summary of what the learner will learn)",
      "estimatedTime": "string (e.g., '2-3 hours')",
      "keyTopics": ["array of subtopic strings, 3-6 items"],
      "prerequisites": ["array of module id strings this module depends on, e.g. ['module_1', 'module_3']. Use [] for entry-point modules with no prerequisites"],
      "resourceCounts": {
        "lessons": "number (1-8)",
        "exercises": "number (0-4)",
        "projects": "number (0-2)",
        "readings": "number (0-3)"
      }
    }
  ]
}

Example dependency structure for a "Python" skill:
- module_1 (Python Foundations) prerequisites: []
- module_2 (Data Types & Variables) prerequisites: ["module_1"]
- module_3 (Control Flow) prerequisites: ["module_2"]
- module_4 (Data Structures) prerequisites: ["module_3"]
- module_5 (Functions & Scope) prerequisites: ["module_4"]
- module_6 (OOP) prerequisites: ["module_5"]
- module_7 (Exception Handling) prerequisites: ["module_5"]
- module_8 (Modules & Packages) prerequisites: ["module_6"]
- module_9 (File I/O) prerequisites: ["module_7"]
- module_10 (Advanced Data Structures) prerequisites: ["module_6", "module_7"]
- module_11 (Functional Programming) prerequisites: ["module_8"]
- module_12 (Testing & Debugging) prerequisites: ["module_8", "module_9"]
- module_13 (Web Development) prerequisites: ["module_10", "module_11", "module_12"]

Notice how modules branch from shared prerequisites and converge at advanced topics.`;

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
