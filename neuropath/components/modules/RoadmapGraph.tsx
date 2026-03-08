"use client";

import { useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  type NodeMouseHandler,
  type Node,
  type Edge,
  type EdgeProps,
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
  type PillNodeData,
} from "@/lib/graphUtils";
import { RoadmapPillNode } from "./RoadmapPillNode";

const nodeTypes = { pillNode: RoadmapPillNode };

function StatusEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
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
      style={{
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        strokeDasharray: style.strokeDasharray,
        opacity: style.opacity,
      }}
    />
  );
}

const edgeTypes = { statusEdge: StatusEdge };

export function RoadmapGraph() {
  const { nodes: dbNodes, activeSkillId, skills, setPeekPanelNodeId } =
    useAppStore();

  const activeSkill = skills.find((s) => s.id === activeSkillId);
  const skillModules = useMemo(
    () =>
      dbNodes
        .filter((n) => n.skill_id === activeSkillId)
        .sort((a, b) => (a.module_order ?? 0) - (b.module_order ?? 0)),
    [dbNodes, activeSkillId]
  );
  const progress = getProgressPercent(skillModules);

  // #region agent log
  fetch('http://127.0.0.1:7255/ingest/b1da3392-fc1d-4bc2-b909-39ad910d2260',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a01fbe'},body:JSON.stringify({sessionId:'a01fbe',location:'RoadmapGraph.tsx:84',message:'skillModules count',data:{count:skillModules.length,activeSkillId,totalDbNodes:dbNodes.length},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  // #endregion

  const { nodes, edges } = useMemo(() => {
    if (skillModules.length === 0) return { nodes: [], edges: [] };

    const { nodes: rfNodes, edges: rfEdges } =
      dbNodesToReactFlow(skillModules);

    const nodeStatusMap: Record<string, NodeStatus> = {};
    for (const n of skillModules) {
      nodeStatusMap[n.id] = n.status;
    }
    const styledEdges: Edge[] = rfEdges.map((e) => ({
      ...e,
      type: "statusEdge",
      data: {
        sourceStatus: nodeStatusMap[e.source] ?? "available",
        targetStatus: nodeStatusMap[e.target] ?? "available",
      },
    }));

    const result = getLayoutedElements(rfNodes, styledEdges, "TB");
    // #region agent log
    fetch('http://127.0.0.1:7255/ingest/b1da3392-fc1d-4bc2-b909-39ad910d2260',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a01fbe'},body:JSON.stringify({sessionId:'a01fbe',location:'RoadmapGraph.tsx:105',message:'layout result',data:{nodeCount:result.nodes.length,edgeCount:result.edges.length,firstNodePos:result.nodes[0]?.position,firstNodeType:result.nodes[0]?.type},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return result;
  }, [skillModules]);

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

  // #region agent log
  fetch('http://127.0.0.1:7255/ingest/b1da3392-fc1d-4bc2-b909-39ad910d2260',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a01fbe'},body:JSON.stringify({sessionId:'a01fbe',location:'RoadmapGraph.tsx:render',message:'rendering ReactFlow',data:{nodesLen:nodes.length,edgesLen:edges.length,nodeIds:nodes.map((n: Node<PillNodeData>)=>n.id).slice(0,3),nodePositions:nodes.slice(0,2).map((n: Node<PillNodeData>)=>n.position)},timestamp:Date.now(),hypothesisId:'H3,H5'})}).catch(()=>{});
  // #endregion

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {activeSkill && (
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-primary-light" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              {activeSkill.name}
            </h1>
          </div>
          <div className="max-w-xs">
            <ProgressBar value={progress} showLabel className="mt-1" />
          </div>
          <p className="text-sm text-muted mt-2">
            {skillModules.length} modules
            {progress > 0 && ` \u00b7 ${progress}% complete`}
          </p>
        </div>
      )}

      <div className="flex-1 relative" ref={(el) => {
        // #region agent log
        if (el) { fetch('http://127.0.0.1:7255/ingest/b1da3392-fc1d-4bc2-b909-39ad910d2260',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a01fbe'},body:JSON.stringify({sessionId:'a01fbe',location:'RoadmapGraph.tsx:container-ref',message:'container dimensions',data:{width:el.offsetWidth,height:el.offsetHeight,clientWidth:el.clientWidth,clientHeight:el.clientHeight},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{}); }
        // #endregion
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll
          zoomOnScroll
          minZoom={0.3}
          maxZoom={1.5}
        >
          <Background color="#1e1e2e" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="!bg-surface !border-border !rounded-lg !shadow-lg [&>button]:!bg-surface [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-surface-light"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
