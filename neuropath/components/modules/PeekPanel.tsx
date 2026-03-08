"use client";

import { motion } from "framer-motion";
import { X, Check, BookOpen, Clock, Lock, Zap } from "lucide-react";
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
    if (progress === 100) {
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#22d3ee", "#10b981"],
      });
    }

    onClose();
  };

  const keyTopics = node.key_topics;

  const hasResources =
    node.resource_counts &&
    (node.resource_counts.lessons > 0 ||
      node.resource_counts.exercises > 0 ||
      node.resource_counts.projects > 0 ||
      node.resource_counts.readings > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-end pr-8"
    >
      <div
        className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[1px] cursor-default"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, x: 12 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.96, x: 12 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-30
          w-[min(360px,calc(100vw-3rem))]
          glass-panel-strong rounded-2xl
          shadow-[0_12px_48px_rgba(0,0,0,0.1)]
          overflow-hidden"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-foreground leading-snug tracking-tight flex-1 min-w-0">
              {node.label}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 transition-colors text-muted hover:text-foreground flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isLocked && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 border border-black/6">
              <Lock className="w-3.5 h-3.5 text-muted flex-shrink-0" />
              <p className="text-xs text-muted leading-relaxed">
                Complete prerequisite modules to unlock this topic.
              </p>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted mb-1.5">
              Big Picture
            </h3>
            <p className="text-sm text-foreground/85 leading-[1.55] line-clamp-4">
              {node.description ||
                "Explore this topic to deepen your understanding."}
            </p>
          </div>

          {keyTopics && keyTopics.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted mb-1.5">
                Key Topics
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {keyTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-lg bg-black/5 border border-black/6 text-foreground/80"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {node.estimated_time && (
              <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                <Clock className="w-3.5 h-3.5 text-secondary-light" />
                <span>{node.estimated_time}</span>
              </div>
            )}
            {hasResources && (
              <div className="flex items-center gap-3 text-xs text-foreground/70">
                {node.resource_counts!.lessons > 0 && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-primary-light" />
                    {node.resource_counts!.lessons} Lessons
                  </span>
                )}
                {node.resource_counts!.exercises > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-secondary-light" />
                    {node.resource_counts!.exercises} Exercises
                  </span>
                )}
                {node.resource_counts!.projects > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-success-light" />
                    {node.resource_counts!.projects} Projects
                  </span>
                )}
                {node.resource_counts!.readings > 0 && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-muted" />
                    {node.resource_counts!.readings} Readings
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onDiveDeeper}
              disabled={isLocked}
              className="flex-1 flex items-center justify-center gap-2
                px-3 py-2.5 rounded-xl border-2 border-primary/40
                bg-primary/10 hover:bg-primary/20
                text-sm font-semibold text-primary-light
                transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BookOpen className="w-4 h-4" />
              Dive Deeper
            </button>

            {isCompleted ? (
              <div
                className="flex-1 flex items-center justify-center gap-2
                  px-3 py-2.5 rounded-xl
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
                  px-3 py-2.5 rounded-xl
                  bg-success/90 hover:bg-success border-2 border-success/60
                  text-sm font-bold text-white
                  transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Mark Complete
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
