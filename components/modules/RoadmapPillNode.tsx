"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Check, Lock, Sparkles } from "lucide-react";
import type { NodeProps } from "reactflow";
import type { PillNodeData } from "@/lib/graphUtils";

const statusConfig: Record<
  string,
  {
    border: string;
    labelBg: string;
    labelText: string;
    labelValue: string;
    icon: React.ReactNode;
  }
> = {
  complete: {
    border: "border-success/40",
    labelBg: "bg-success/15",
    labelText: "text-success",
    labelValue: "COMPLETED",
    icon: <Check className="w-3.5 h-3.5 text-success" />,
  },
  known: {
    border: "border-success/30",
    labelBg: "bg-success/15",
    labelText: "text-success",
    labelValue: "COMPLETED",
    icon: <Check className="w-3.5 h-3.5 text-success" />,
  },
  available: {
    border: "border-primary/40",
    labelBg: "bg-primary/10",
    labelText: "text-primary-dark",
    labelValue: "AVAILABLE",
    icon: <Sparkles className="w-3.5 h-3.5 text-primary" />,
  },
  in_progress: {
    border: "border-secondary/40",
    labelBg: "bg-secondary/10",
    labelText: "text-secondary-dark",
    labelValue: "IN PROGRESS",
    icon: <Sparkles className="w-3.5 h-3.5 text-secondary" />,
  },
  locked: {
    border: "border-border",
    labelBg: "bg-black/5",
    labelText: "text-muted",
    labelValue: "LOCKED",
    icon: <Lock className="w-3.5 h-3.5 text-muted" />,
  },
};

function RoadmapPillNodeComponent({ data }: NodeProps<PillNodeData>) {
  const config = statusConfig[data.status] || statusConfig.available;

  return (
    <div
      className={`
        relative px-5 py-4 rounded-2xl border
        min-w-[220px] max-w-[280px]
        cursor-pointer select-none
        transition-all duration-200
        glass-node
        hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]
        ${config.border}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-border !border-0 !-left-1"
      />

      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <span
            className={`
              inline-block text-[9px] font-semibold tracking-wider uppercase mb-0.5
              px-1.5 py-0.5 rounded
              ${config.labelBg} ${config.labelText}
            `}
          >
            {config.labelValue}
          </span>
          <p className="text-sm font-semibold text-foreground leading-tight break-words whitespace-normal">
            {data.label}
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-border !border-0 !-right-1"
      />
    </div>
  );
}

export const RoadmapPillNode = memo(RoadmapPillNodeComponent);
