import dagre from "dagre";
import type { Node, Edge } from "reactflow";
import type { DBNode } from "@/types";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 70;

export interface PillNodeData {
  label: string;
  status: DBNode["status"];
  nodeId: string;
}

export function dbNodesToReactFlow(nodes: DBNode[]): {
  nodes: Node<PillNodeData>[];
  edges: Edge[];
} {
  const sorted = [...nodes].sort(
    (a, b) => (a.module_order ?? 0) - (b.module_order ?? 0)
  );

  const rfNodes: Node<PillNodeData>[] = sorted.map((n) => ({
    id: n.id,
    type: "pillNode",
    position: { x: 0, y: 0 },
    data: {
      label: n.label,
      status: n.status,
      nodeId: n.id,
    },
  }));

  const edges: Edge[] = [];
  const nodeKeyToId = new Map(sorted.map((n) => [n.node_key, n.id]));

  const hasAnyPrereqs = sorted.some(
    (n) => n.prerequisites && n.prerequisites.length > 0
  );

  if (hasAnyPrereqs) {
    for (const node of sorted) {
      if (node.prerequisites && node.prerequisites.length > 0) {
        for (const prereqKey of node.prerequisites) {
          const sourceId = nodeKeyToId.get(prereqKey);
          if (sourceId) {
            edges.push({
              id: `e-${sourceId}-${node.id}`,
              source: sourceId,
              target: node.id,
              type: "smoothstep",
            });
          }
        }
      }
    }
  } else {
    for (let i = 0; i < sorted.length - 1; i++) {
      edges.push({
        id: `e-${sorted[i].id}-${sorted[i + 1].id}`,
        source: sorted[i].id,
        target: sorted[i + 1].id,
        type: "smoothstep",
      });
    }
  }

  return { nodes: rfNodes, edges };
}

export function getLayoutedElements(
  nodes: Node<PillNodeData>[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): { nodes: Node<PillNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function getEdgeStyle(
  sourceStatus: DBNode["status"],
  targetStatus: DBNode["status"]
): {
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
  opacity: number;
} {
  const sourceComplete =
    sourceStatus === "complete" || sourceStatus === "known";
  const targetComplete =
    targetStatus === "complete" || targetStatus === "known";

  if (sourceComplete && targetComplete) {
    return {
      stroke: "#10b981",
      strokeWidth: 2,
      strokeDasharray: "6 3",
      opacity: 1,
    };
  }

  if (sourceComplete) {
    return {
      stroke: "#6366f1",
      strokeWidth: 2,
      strokeDasharray: "6 3",
      opacity: 0.9,
    };
  }

  return {
    stroke: "#334155",
    strokeWidth: 1.5,
    strokeDasharray: "4 4",
    opacity: 0.4,
  };
}
