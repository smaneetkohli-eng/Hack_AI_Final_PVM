"use client";

import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  type NodeMouseHandler,
  type Node,
  type Edge,
  type EdgeProps,
  type NodeChange,
  BaseEdge,
  getSmoothStepPath,
} from "reactflow";
import "reactflow/dist/style.css";
import { Map, Sparkles } from "lucide-react";
import type { NodeStatus } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { getProgressPercent } from "@/lib/roadmapUtils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  dbNodesToReactFlow,
  getLayoutedElements,
  getEdgeStyle,
  getEdgeMarker,
  type PillNodeData,
} from "@/lib/graphUtils";
import { RoadmapPillNode } from "./RoadmapPillNode";
import { createClient } from "@/lib/supabase";

const nodeTypes = { pillNode: RoadmapPillNode };

let dashCssInjected = false;
function injectDashCSS() {
  if (dashCssInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = `@keyframes dashFlow { to { stroke-dashoffset: -20; } }`;
  document.head.appendChild(style);
  dashCssInjected = true;
}

function StatusEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps & { data?: { sourceStatus: string; targetStatus: string } }) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  const style = getEdgeStyle(
    (data?.sourceStatus as NodeStatus) ?? "available",
    (data?.targetStatus as NodeStatus) ?? "available"
  );

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        strokeDasharray: style.strokeDasharray,
        opacity: style.opacity,
        ...(style.animated
          ? { animation: "dashFlow 0.6s linear infinite" }
          : {}),
      }}
    />
  );
}

const edgeTypes = { statusEdge: StatusEdge };

export function RoadmapGraph() {
  const {
    nodes: dbNodes,
    activeSkillId,
    skills,
    setPeekPanelNodeId,
    updateNodePosition,
  } = useAppStore();

  useEffect(() => { injectDashCSS(); }, []);

  const activeSkill = skills.find((s) => s.id === activeSkillId);
  const skillModules = useMemo(
    () =>
      dbNodes
        .filter((n) => n.skill_id === activeSkillId)
        .sort((a, b) => (a.module_order ?? 0) - (b.module_order ?? 0)),
    [dbNodes, activeSkillId]
  );
  const progress = getProgressPercent(skillModules);

  const savedPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const n of skillModules) {
      if (n.position_x != null && n.position_y != null) {
        positions[n.id] = { x: n.position_x, y: n.position_y };
      }
    }
    return Object.keys(positions).length > 0 ? positions : undefined;
  }, [skillModules]);

  const { initialNodes, edges: layoutedEdges } = useMemo(() => {
    if (skillModules.length === 0)
      return { initialNodes: [] as Node<PillNodeData>[], edges: [] as Edge[] };

    const { nodes: rfNodes, edges: rfEdges } =
      dbNodesToReactFlow(skillModules);

    const nodeStatusMap: Record<string, NodeStatus> = {};
    for (const n of skillModules) {
      nodeStatusMap[n.id] = n.status;
    }

    const styledEdges: Edge[] = rfEdges.map((e) => {
      const sourceStatus = (nodeStatusMap[e.source] ?? "available") as NodeStatus;
      const targetStatus = (nodeStatusMap[e.target] ?? "available") as NodeStatus;
      return {
        ...e,
        type: "statusEdge",
        data: { sourceStatus, targetStatus },
        markerEnd: getEdgeMarker(sourceStatus, targetStatus),
      };
    });

    const result = getLayoutedElements(rfNodes, styledEdges, "LR", savedPositions);
    return { initialNodes: result.nodes, edges: result.edges };
  }, [skillModules, savedPositions]);

  const [displayNodes, setDisplayNodes] = useState<Node<PillNodeData>[]>(initialNodes);

  useEffect(() => {
    setDisplayNodes(initialNodes);
  }, [initialNodes]);

  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setDisplayNodes((prev) => applyNodeChanges(changes, prev) as Node<PillNodeData>[]);

      const dragStops = changes.filter(
        (c) => c.type === "position" && c.dragging === false && c.position
      );

      if (dragStops.length > 0) {
        for (const change of dragStops) {
          if (change.type === "position" && change.position) {
            updateNodePosition(change.id, change.position.x, change.position.y);
          }
        }

        if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = setTimeout(async () => {
          const supabase = createClient();
          const currentDbNodes = useAppStore.getState().nodes;

          for (const change of dragStops) {
            if (change.type === "position" && change.position) {
              const dbNode = currentDbNodes.find((d) => d.id === change.id);
              if (
                dbNode &&
                (dbNode.position_x !== change.position.x ||
                  dbNode.position_y !== change.position.y)
              ) {
                await supabase
                  .from("nodes")
                  .update({
                    position_x: change.position.x,
                    position_y: change.position.y,
                  })
                  .eq("id", change.id);
              }
            }
          }
        }, 500);
      }
    },
    [updateNodePosition]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event: React.MouseEvent, node: Node<PillNodeData>) => {
      setPeekPanelNodeId(node.data.nodeId);
    },
    [setPeekPanelNodeId]
  );

  if (!activeSkillId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted">
          <Map className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h2 className="font-display text-xl font-semibold mb-2">
            No skill selected
          </h2>
          <p className="text-sm">
            Select a skill from the sidebar or create a new one to see your
            roadmap.
          </p>
        </div>
      </div>
    );
  }

  if (skillModules.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted">
          <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No modules found for this skill.</p>
          <p className="text-xs mt-1">Try regenerating the roadmap.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {activeSkill && (
        <div className="px-6 pt-6 pb-2">
          <div className="inline-flex flex-col gap-2 p-4 rounded-2xl glass-panel shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="font-title text-xl font-medium text-foreground tracking-tight">
                {activeSkill.name}
              </h1>
            </div>
            <div className="max-w-xs">
              <ProgressBar value={progress} showLabel className="mt-1" />
            </div>
            <p className="text-sm text-muted">
              {skillModules.length} modules
              {progress > 0 && ` \u00b7 ${progress}% complete`}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        <ReactFlow
          nodes={displayNodes}
          edges={layoutedEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          panOnScroll
          zoomOnScroll
          minZoom={0.3}
          maxZoom={1.5}
        >
          <Background color="#e5e5e7" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="!rounded-xl !shadow-glass glass-controls [&>button]:!text-foreground"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
