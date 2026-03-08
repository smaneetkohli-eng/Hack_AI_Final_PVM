"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Clock,
  BookOpen,
  Layers,
  Loader2,
  Eye,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
import { AIDescriptionContent } from "./AIDescriptionContent";
import { ModuleResourcePanel } from "./ModuleResourcePanel";
import { createClient } from "@/lib/supabase";
import confetti from "canvas-confetti";
import { getProgressPercent, recalculateStatuses } from "@/lib/roadmapUtils";

export function ModuleView() {
  const {
    selectedNodeId,
    setSelectedNodeId,
    nodes,
    setNodes,
    updateNodeStatus,
    activeSkillId,
    skills,
    user,
  } = useAppStore();

  const node = nodes.find((n) => n.id === selectedNodeId);
  const skill = skills.find((s) => s.id === activeSkillId);
  const [explanation, setExplanation] = useState<string>("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const moduleNumber = node?.module_order ?? (
    nodes
      .filter((n) => n.skill_id === activeSkillId)
      .sort((a, b) => (a.module_order ?? 0) - (b.module_order ?? 0))
      .findIndex((n) => n.id === selectedNodeId) + 1
  );

  const isStepsFormat = (text: string) =>
    /^##\s+Step\s+\d/m.test(text);

  const fetchLearningSteps = useCallback(async (force = false) => {
    if (!node) return;

    if (!force && node.ai_explanation && isStepsFormat(node.ai_explanation)) {
      setExplanation(node.ai_explanation);
      return;
    }

    setExplanation("");
    setLoadingExplanation(true);
    try {
      const response = await fetch("/api/roadmap/learning-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, force }),
      });

      if (!response.ok) {
        setExplanation(node.description || "Learning steps unavailable.");
        return;
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          text += chunk;
          setExplanation(text);
        }

        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          setExplanation(node.description || "Learning steps unavailable.");
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching learning steps:", error);
      setExplanation(node.description || "Learning steps unavailable.");
    } finally {
      setLoadingExplanation(false);
    }
  }, [node]);

  useEffect(() => {
    if (selectedNodeId && node) {
      if (node.ai_explanation && isStepsFormat(node.ai_explanation)) {
        setExplanation(node.ai_explanation);
      } else {
        setExplanation("");
      }
      fetchLearningSteps();
      loadNotes();
      logEvent("node_viewed");
    }
  }, [selectedNodeId]);

  const loadNotes = async () => {
    if (!node || !user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("node_notes")
      .select("content")
      .eq("node_id", node.id)
      .eq("user_id", user.id)
      .single();
    if (data?.content) setNotes(data.content);
    else setNotes("");
  };

  const saveNotes = async () => {
    if (!node || !user) return;
    setSavingNotes(true);
    const supabase = createClient();
    await supabase.from("node_notes").upsert(
      {
        node_id: node.id,
        user_id: user.id,
        content: notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "node_id,user_id" }
    );
    logEvent("note_saved");
    setSavingNotes(false);
  };

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
  };

  const handleMarkKnown = async () => {
    if (!node) return;

    updateNodeStatus(node.id, "known");
    logEvent("node_completed");

    const supabase = createClient();
    await supabase
      .from("nodes")
      .update({ status: "known" })
      .eq("id", node.id);

    const updatedNodes = nodes.map((n) =>
      n.id === node.id ? { ...n, status: "known" as const } : n
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
  };

  if (!node || !selectedNodeId) return null;

  const isCompleted = node.status === "complete" || node.status === "known";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 bg-background overflow-y-auto"
    >
      <div className="sticky top-0 z-10 px-6 py-3 max-w-6xl mx-auto flex items-center justify-between gap-3">
        <button
          onClick={() => setSelectedNodeId(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 border border-black/6
            text-sm text-muted hover:text-foreground hover:bg-white
            shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Modules
        </button>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm
          ${isCompleted && node?.status === "complete"
            ? "bg-primary/10 border-primary/20"
            : isCompleted && node?.status === "known"
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-white/80 border-black/6"
          }`}>
          {!isCompleted && (
            <>
              <Button variant="secondary" size="sm" onClick={handleMarkKnown}
                className="rounded-lg"
              >
                <Eye className="w-3.5 h-3.5" />
                Already Know This
              </Button>
              <Button size="sm" onClick={handleMarkComplete}
                className="rounded-lg"
              >
                <Check className="w-3.5 h-3.5" />
                Mark Complete
              </Button>
            </>
          )}
          {isCompleted && (
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium
              ${node.status === "complete" ? "text-primary" : "text-emerald-600"}`}>
              <Check className="w-3 h-3" />
              {node.status === "complete" ? "Completed" : "Known"}
            </span>
          )}
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary-light mb-1">
            Module {moduleNumber}
          </p>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {node.label}
          </h1>
          {node.estimated_time && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Clock className="w-4 h-4" />
              {node.estimated_time}
            </div>
          )}
        </div>

        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0 max-w-3xl space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-black/6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                Learning Path
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchLearningSteps(true)}
                loading={loadingExplanation}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </Button>
            </div>
            {loadingExplanation && !explanation ? (
              <div className="flex items-center gap-2 text-sm text-muted py-6">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating learning steps...
              </div>
            ) : (
              <motion.div
                className="max-w-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <AIDescriptionContent
                  content={explanation || node.description || ""}
                />
              </motion.div>
            )}
            <p className="text-[10px] text-muted mt-4">
              Generated using Claude API &middot; Resources embedded in steps
            </p>
          </div>

          {node.key_topics && (node.key_topics as string[]).length > 0 && (
            <div className="glass-panel rounded-2xl p-6 border border-black/6">
              <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-light" />
                Key Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {(node.key_topics as string[]).map((topic) => (
                  <Badge key={topic} variant="default">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="glass-panel rounded-2xl p-6 border border-black/6">
            <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-secondary" />
              Your Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Take notes as you learn..."
              className="w-full bg-black/4 border border-black/8 rounded-xl px-4 py-3
                text-sm text-foreground placeholder:text-muted/50 resize-none min-h-[120px]
                focus:outline-none focus:border-primary/40 transition-colors"
            />
            {savingNotes && (
              <p className="text-xs text-muted mt-1">Saving...</p>
            )}
          </div>
          </div>

          <aside className="w-[340px] flex-shrink-0 sticky top-[72px]">
            <div className="glass-panel rounded-2xl p-5 border border-black/6">
              <ModuleResourcePanel
                nodeId={node.id}
                nodeLabel={node.label}
                skillName={skill?.name ?? "Skill"}
              />
            </div>
          </aside>
        </div>
      </div>
    </motion.div>
  );
}
