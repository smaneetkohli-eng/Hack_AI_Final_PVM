import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const { data: node, error } = await supabase
    .from("nodes")
    .update({ status: "complete" })
    .eq("id", id)
    .select("*, skill_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: allNodes } = await supabase
    .from("nodes")
    .select("*")
    .eq("skill_id", node.skill_id);

  if (allNodes) {
    for (const n of allNodes) {
      if (n.status === "locked") {
        const prereqs = (n.prerequisites as string[]) || [];
        const allMet = prereqs.every((p) => {
          const prereqNode = allNodes.find((an) => an.node_key === p);
          return prereqNode && (prereqNode.status === "complete" || prereqNode.status === "known");
        });
        if (allMet) {
          await supabase
            .from("nodes")
            .update({ status: "available" })
            .eq("id", n.id);
        }
      }
    }
  }

  await supabase.from("learning_events").insert({
    user_id: user.id,
    skill_id: node.skill_id,
    node_id: id,
    event_type: "node_completed",
  });

  return NextResponse.json({ node });
}
