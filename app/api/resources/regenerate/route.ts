import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { fetchResourcesForNode } from "@/lib/resourceFetcher";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nodeId, nodeLabel, skillName } = await request.json();

  await supabase.from("node_resources").delete().eq("node_id", nodeId);

  await supabase.from("learning_events").insert({
    user_id: user.id,
    node_id: nodeId,
    event_type: "resource_regenerated",
  });

  const results = await fetchResourcesForNode(nodeLabel, skillName);

  const toInsert = results.map((r) => ({
    node_id: nodeId,
    type: r.type,
    title: r.title,
    url: r.url,
    source_name: r.source_name,
    thumbnail_url: r.thumbnail_url || null,
    duration: r.duration || null,
    is_verified: r.is_verified,
    last_fetched_at: new Date().toISOString(),
  }));

  if (toInsert.length > 0) {
    const { data: inserted } = await supabase
      .from("node_resources")
      .insert(toInsert)
      .select();
    return NextResponse.json({ resources: inserted || [] });
  }

  return NextResponse.json({ resources: [] });
}
