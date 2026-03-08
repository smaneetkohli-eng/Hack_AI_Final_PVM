import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { fetchResourcesForNode } from "@/lib/resourceFetcher";

export async function GET(
  _request: NextRequest,
  { params }: { params: { nodeId: string } }
) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nodeId } = params;

  const { data: existing } = await supabase
    .from("node_resources")
    .select("*")
    .eq("node_id", nodeId);

  if (existing && existing.length > 0) {
    const lastFetched = existing[0]?.last_fetched_at;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    if (lastFetched && lastFetched > sevenDaysAgo) {
      return NextResponse.json({ resources: existing });
    }
  }

  const { data: node } = await supabase
    .from("nodes")
    .select("label, skill_id")
    .eq("id", nodeId)
    .single();

  if (!node) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  const { data: skill } = await supabase
    .from("skills")
    .select("name")
    .eq("id", node.skill_id)
    .single();

  const results = await fetchResourcesForNode(
    node.label,
    skill?.name || ""
  );

  if (existing && existing.length > 0) {
    await supabase
      .from("node_resources")
      .delete()
      .eq("node_id", nodeId);
  }

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
