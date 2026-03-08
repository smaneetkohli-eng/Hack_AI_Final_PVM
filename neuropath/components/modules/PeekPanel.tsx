"use client";

import { motion } from "framer-motion";
import { X, Check, ArrowRight, Clock, Lock } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase";
import { getProgressPercent, recalculateStatuses } from "@/lib/roadmapUtils";
import confetti from "canvas-confetti";

interface PeekPanelProps {
  nodeId: string;
  onClose: () => void;
  onDiveDeeper: () => void;
}

export function PeekPanel({ nodeId, onClose, onDiveDeeper }: PeekPanelProps) {
  const { nodes, setNodes, updateNodeStatus, activeSkillId, user } =
    useAppStore();

  const node = nodes.find((n) => n.id === nodeId);

  if (!node) return null;

  const isCompleted = node.status === "complete" || node.status === "known";
  const isLocked = node.status === "locked";

  const logEvent = async (eventType: string) => {
    if (!user || !node) return;
    const supabase = createClient();
    await supabase.from("learning_events").insert({
      user_id: user.id,
      skill_id: activeSkillId,
      node_id: node.id,
      event_type: eventType,
    });
  };

  const handleMarkComplete = async () => {
    if (!node) return;

    updateNodeStatus(node.id, "complete");
    logEvent("node_completed");

    const supabase = createClient();
    await supabase
      .from("nodes")
      .update({ status: "complete" })
      .eq("id", node.id);

    const updatedNodes = nodes.map((n) =>
      n.id === node.id ? { ...n, status: "complete" as const } : n
    );
    const recalculated = recalculateStatuses(updatedNodes);
    setNodes(recalculated);

    for (const n of recalculated) {
      if (n.status !== updatedNodes.find((u) => u.id === n.id)?.status) {
        await supabase
          .from("nodes")
          .update({ status: n.status })
          .eq("id", n.id);
      }
    }

    const progress = getProgressPercent(recalculated);
    if (
      progress === 25 ||
      progress === 50 ||
      progress === 75 ||
      progress === 100
    ) {
      confetti({
        particleCount: progress === 100 ? 200 : 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#22d3ee", "#10b981"],
      });
    }

    onClose();
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-[380px] z-30
        bg-surface border-l border-border shadow-2xl
        flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-5 border-b border-border">
        <span className="text-[10px] font-bold tracking-widest uppercase text-primary-light">
          Topic Overview
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-light transition-colors text-muted hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground leading-snug">
            {node.label}
          </h2>
        </div>

        {isLocked && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-light border border-border">
            <Lock className="w-4 h-4 text-muted flex-shrink-0" />
            <p className="text-xs text-muted">
              Complete prerequisite modules to unlock this topic.
            </p>
          </div>
        )}

        <div>
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2">
            Big Picture
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {node.description || "Explore this topic to deepen your understanding."}
          </p>
        </div>

        {node.estimated_time && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock className="w-4 h-4" />
            <span>{node.estimated_time}</span>
          </div>
        )}
      </div>

      <div className="p-5 border-t border-border space-y-2">
        <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-3">
          Actions
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDiveDeeper}
            disabled={isLocked}
            className="flex-1 flex items-center justify-center gap-2
              px-4 py-3 rounded-xl border-2 border-border
              bg-surface-light hover:bg-surface-lighter
              text-sm font-semibold text-foreground
              transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-4 h-4" />
            Expand Details
          </button>

          {isCompleted ? (
            <div
              className="flex-1 flex items-center justify-center gap-2
                px-4 py-3 rounded-xl
                bg-success/20 border-2 border-success/40
                text-sm font-semibold text-success-light"
            >
              <Check className="w-4 h-4" />
              Completed
            </div>
          ) : (
            <button
              onClick={handleMarkComplete}
              disabled={isLocked}
              className="flex-1 flex items-center justify-center gap-2
                px-4 py-3 rounded-xl
                bg-red-500/90 hover:bg-red-500 border-2 border-red-500/60
                text-sm font-bold text-white
                transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Done
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
