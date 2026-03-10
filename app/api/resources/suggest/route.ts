import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { callClaude } from "@/lib/anthropic";
import { isVerifiedSource, isAutoApproveDomain } from "@/config/trustedSources";

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

  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const isVideo = url.includes("youtube.com") || url.includes("youtu.be");
    const autoApprove = isAutoApproveDomain(url);

    let title: string = url;
    let type: string = isVideo ? "video" : "article";
    let sourceName: string = hostname;

    if (autoApprove) {
      if (isVideo) {
        sourceName = "YouTube";
        title = `${nodeLabel} - YouTube Resource`;
      } else if (hostname.includes("github.com")) {
        sourceName = "GitHub";
        type = "project";
        title = `${nodeLabel} - GitHub Resource`;
      } else {
        title = `${nodeLabel} - ${hostname}`;
      }

      try {
        const meta = await callClaude(
          `Given this URL and topic, generate a short descriptive title (max 60 chars). Return ONLY the title text, nothing else.`,
          `URL: ${url}\nTopic: ${nodeLabel}`
        );
        const cleaned = meta.trim().replace(/^["']|["']$/g, "");
        if (cleaned.length > 3 && cleaned.length < 100) {
          title = cleaned;
        }
      } catch {
        // title fallback is fine
      }
    } else {
      const evaluation = await callClaude(
        `You evaluate learning resource URLs. You CANNOT access URLs, so judge based on the domain name and URL structure alone.
IMPORTANT: Be lenient. If the domain looks like a legitimate website (not spam/malware), approve it.
Respond with JSON only: { "approved": boolean, "title": "string", "type": "video|article|doc", "source_name": "string" }`,
        `URL: ${url}\nTopic: ${nodeLabel}\n\nProvide metadata for this resource.`
      );

      const cleaned = evaluation.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(cleaned);

      if (!result.approved) {
        return NextResponse.json({
          approved: false,
          reason: "URL domain not recognized as a learning resource.",
        });
      }

      title = result.title || title;
      type = result.type || type;
      sourceName = result.source_name || sourceName;
    }

    const { data: resource } = await supabase
      .from("node_resources")
      .insert({
        node_id: nodeId,
        type: isVideo ? "video" : type,
        title,
        url,
        source_name: sourceName,
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
