import type { DBNode, NodeStatus, ModuleRoadmap, ModuleData } from "@/types";

export function moduleRoadmapToDBNodes(
  roadmap: ModuleRoadmap,
  skillId: string
): Omit<DBNode, "id" | "created_at">[] {
  return roadmap.modules.map((mod: ModuleData) => ({
    skill_id: skillId,
    node_key: mod.id,
    label: mod.label,
    description: mod.description,
    tier: null,
    estimated_time: mod.estimatedTime,
    key_topics: mod.keyTopics,
    prerequisites: null,
    status: "available" as NodeStatus,
    position_x: null,
    position_y: null,
    ai_explanation: null,
    module_order: mod.order,
    resource_counts: mod.resourceCounts,
  }));
}

export function getProgressPercent(nodes: DBNode[]): number {
  if (nodes.length === 0) return 0;
  const completed = nodes.filter(
    (n) => n.status === "complete" || n.status === "known"
  ).length;
  return Math.round((completed / nodes.length) * 100);
}

export function recalculateStatuses(nodes: DBNode[]): DBNode[] {
  return nodes.map((node) => ({
    ...node,
    status: computeNodeStatus(node),
  }));
}

export function computeNodeStatus(node: DBNode): NodeStatus {
  if (node.status === "complete" || node.status === "known") return node.status;
  return node.status === "locked" ? "available" : node.status;
}
