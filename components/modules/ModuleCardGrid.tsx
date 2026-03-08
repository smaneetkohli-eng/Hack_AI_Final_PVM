"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Map, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getProgressPercent } from "@/lib/roadmapUtils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ModuleCard } from "./ModuleCard";

export function ModuleCardGrid() {
  const { nodes, activeSkillId, skills, setSelectedNodeId } = useAppStore();

  const activeSkill = skills.find((s) => s.id === activeSkillId);
  const skillModules = useMemo(
    () =>
      nodes
        .filter((n) => n.skill_id === activeSkillId)
        .sort((a, b) => (a.module_order ?? 0) - (b.module_order ?? 0)),
    [nodes, activeSkillId]
  );
  const progress = getProgressPercent(skillModules);

  const handleModuleClick = (moduleId: string) => {
    setSelectedNodeId(moduleId);
  };

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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeSkill && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
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
          </motion.div>
        )}

        {skillModules.length === 0 ? (
          <div className="text-center text-muted py-20">
            <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No modules found for this skill.</p>
            <p className="text-xs mt-1">Try regenerating the roadmap.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {skillModules.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                index={i}
                onClick={handleModuleClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
