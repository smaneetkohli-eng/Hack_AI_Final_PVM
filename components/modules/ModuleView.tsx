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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/store/useAppStore";
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

  const fetchExplanation = useCallback(async () => {
    if (!node || !skill) return;

    if (node.ai_explanation) {
      setExplanation(node.ai_explanation);
      return;
    }

    setLoadingExplanation(true);
    try {
      const response = await fetch("/api/roadmap/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain",
          nodeLabel: node.label,
          nodeDescription: node.description,
          keyTopics: node.key_topics,
          skillName: skill.name,
        }),
      });

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value);
          setExplanation(text);
        }

        const supabase = createClient();
        await supabase
          .from("nodes")
          .update({ ai_explanation: text })
          .eq("id", node.id);
      }
    } catch (error) {
      console.error("Error fetching explanation:", error);
    } finally {
      setLoadingExplanation(false);
    }
  }, [node, skill]);

  useEffect(() => {
    if (selectedNodeId && node) {
      setExplanation(node.ai_explanation || "");
      fetchExplanation();
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
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-6 py-3 max-w-5xl mx-auto">
          <button
            onClick={() => setSelectedNodeId(null)}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Modules
          </button>
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <>
                <Button variant="secondary" size="sm" onClick={handleMarkKnown}>
                  <Eye className="w-3.5 h-3.5" />
                  Already Know This
                </Button>
                <Button size="sm" onClick={handleMarkComplete}>
                  <Check className="w-3.5 h-3.5" />
                  Mark Complete
                </Button>
              </>
            )}
            {isCompleted && (
              <Badge variant={node.status === "complete" ? "primary" : "success"}>
                <Check className="w-3 h-3" />
                {node.status === "complete" ? "Completed" : "Known"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
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

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                AI Generated Description
              </h3>
              {loadingExplanation && !explanation ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating description...
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {explanation || node.description}
                  </p>
                </div>
              )}
              <p className="text-[10px] text-muted mt-4">
                Generated using Claude API
              </p>
            </div>

            {node.key_topics && (node.key_topics as string[]).length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-6">
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

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-secondary" />
                Your Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Take notes as you learn..."
                className="w-full bg-surface-light border border-border rounded-lg px-4 py-3
                  text-sm text-foreground placeholder:text-muted/50 resize-none min-h-[120px]
                  focus:outline-none focus:border-primary transition-colors"
              />
              {savingNotes && (
                <p className="text-xs text-muted mt-1">Saving...</p>
              )}
            </div>
          </div>

          <div className="w-full lg:w-96">
            <ModuleResourcePanel
              nodeId={node.id}
              nodeLabel={node.label}
              skillName={skill?.name || ""}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
