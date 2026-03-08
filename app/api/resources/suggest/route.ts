import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { callClaude } from "@/lib/anthropic";
import { isVerifiedSource } from "@/config/trustedSources";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nodeId, url, nodeLabel } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const evaluation = await callClaude(
    `You evaluate learning resources. Given a URL and a topic, determine if this is a credible, useful learning resource. Respond with JSON only: { "approved": boolean, "title": "string", "type": "video|article|doc", "source_name": "string", "reason": "string" }`,
    `URL: ${url}\nTopic: ${nodeLabel}\n\nEvaluate this resource.`
  );

  try {
    const cleaned = evaluation.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    if (!result.approved) {
      return NextResponse.json({
        approved: false,
        reason: result.reason,
      });
    }

    const hostname = new URL(url).hostname.replace("www.", "");
    const isVideo = url.includes("youtube.com") || url.includes("youtu.be");

    const { data: resource } = await supabase
      .from("node_resources")
      .insert({
        node_id: nodeId,
        type: isVideo ? "video" : result.type || "article",
        title: result.title || url,
        url,
        source_name: result.source_name || hostname,
        is_verified: isVerifiedSource(url),
        last_fetched_at: new Date().toISOString(),
      })
      .select()
      .single();

    return NextResponse.json({ approved: true, resource });
  } catch {
    return NextResponse.json(
      { error: "Failed to evaluate resource" },
      { status: 500 }
    );
  }
}
