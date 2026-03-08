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
    bg: string;
    labelBg: string;
    labelText: string;
    labelValue: string;
    icon: React.ReactNode;
    glow: string;
  }
> = {
  complete: {
    border: "border-success/60",
    bg: "bg-[#0d2818]",
    labelBg: "bg-success/20",
    labelText: "text-success-light",
    labelValue: "COMPLETED",
    icon: <Check className="w-3.5 h-3.5 text-success-light" />,
    glow: "shadow-[0_0_16px_rgba(16,185,129,0.25)]",
  },
  known: {
    border: "border-success/50",
    bg: "bg-[#0d2818]",
    labelBg: "bg-success/20",
    labelText: "text-success-light",
    labelValue: "COMPLETED",
    icon: <Check className="w-3.5 h-3.5 text-success-light" />,
    glow: "shadow-[0_0_16px_rgba(16,185,129,0.2)]",
  },
  available: {
    border: "border-primary/50",
    bg: "bg-[#111130]",
    labelBg: "bg-primary/15",
    labelText: "text-primary-light",
    labelValue: "AVAILABLE",
    icon: <Sparkles className="w-3.5 h-3.5 text-primary-light" />,
    glow: "shadow-[0_0_16px_rgba(99,102,241,0.2)]",
  },
  in_progress: {
    border: "border-secondary/50",
    bg: "bg-[#0a1a20]",
    labelBg: "bg-secondary/15",
    labelText: "text-secondary-light",
    labelValue: "IN PROGRESS",
    icon: <Sparkles className="w-3.5 h-3.5 text-secondary-light" />,
    glow: "shadow-[0_0_16px_rgba(34,211,238,0.2)]",
  },
  locked: {
    border: "border-border",
    bg: "bg-surface",
    labelBg: "bg-surface-lighter",
    labelText: "text-muted",
    labelValue: "LOCKED",
    icon: <Lock className="w-3.5 h-3.5 text-muted" />,
    glow: "",
  },
};

function RoadmapPillNodeComponent({ data }: NodeProps<PillNodeData>) {
  const config = statusConfig[data.status] || statusConfig.available;

  return (
    <div
      className={`
        relative px-5 py-3.5 rounded-xl border-2
        min-w-[220px] max-w-[260px]
        cursor-pointer select-none
        transition-all duration-200
        hover:scale-[1.03] hover:brightness-110
        ${config.border} ${config.bg} ${config.glow}
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
          <p className="text-sm font-semibold text-foreground leading-tight truncate">
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
