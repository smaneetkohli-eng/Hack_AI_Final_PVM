"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Code2,
  FolderGit2,
  FileText,
  Check,
  ArrowRight,
} from "lucide-react";
import type { DBNode } from "@/types";

interface ModuleCardProps {
  module: DBNode;
  index: number;
  onClick: (id: string) => void;
}

const statusStyles: Record<string, { border: string; badge: string; badgeText: string }> = {
  available: {
    border: "border-border hover:border-primary/60",
    badge: "bg-primary/10 text-primary-light",
    badgeText: "Available",
  },
  in_progress: {
    border: "border-primary/50 hover:border-primary",
    badge: "bg-primary/20 text-primary-light",
    badgeText: "In Progress",
  },
  complete: {
    border: "border-success/50 hover:border-success",
    badge: "bg-success/20 text-success-light",
    badgeText: "Complete",
  },
  known: {
    border: "border-success/40 hover:border-success",
    badge: "bg-success/20 text-success-light",
    badgeText: "Known",
  },
  locked: {
    border: "border-border",
    badge: "bg-surface-lighter text-muted",
    badgeText: "Locked",
  },
};

function ModuleCardComponent({ module, index, onClick }: ModuleCardProps) {
  const style = statusStyles[module.status] || statusStyles.available;
  const counts = module.resource_counts;
  const isCompleted = module.status === "complete" || module.status === "known";
  const moduleNumber = module.module_order ?? index + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => onClick(module.id)}
      className={`
        group relative flex flex-col justify-between
        rounded-2xl bg-surface border-2 p-6
        min-h-[240px] cursor-pointer
        transition-all duration-300 ease-out
        hover:bg-surface-light hover:shadow-glow-sm hover:-translate-y-1
        ${style.border}
      `}
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <span className="font-display text-2xl font-bold text-muted/40">
            {String(moduleNumber).padStart(2, "0")}
          </span>
          {isCompleted && (
            <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-success-light" />
            </div>
          )}
          {!isCompleted && (
            <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
              {style.badgeText}
            </span>
          )}
        </div>

        <h3 className="font-display text-base font-semibold text-foreground leading-snug mb-2 line-clamp-2">
          {module.label}
        </h3>

        {module.estimated_time && (
          <p className="text-xs text-muted mb-3">{module.estimated_time}</p>
        )}

        {counts && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {counts.lessons > 0 && (
              <span className="inline-flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {counts.lessons} {counts.lessons === 1 ? "lesson" : "lessons"}
              </span>
            )}
            {counts.exercises > 0 && (
              <span className="inline-flex items-center gap-1">
                <Code2 className="w-3 h-3" />
                {counts.exercises} {counts.exercises === 1 ? "exercise" : "exercises"}
              </span>
            )}
            {counts.projects > 0 && (
              <span className="inline-flex items-center gap-1">
                <FolderGit2 className="w-3 h-3" />
                {counts.projects} {counts.projects === 1 ? "project" : "projects"}
              </span>
            )}
            {counts.readings > 0 && (
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {counts.readings} {counts.readings === 1 ? "reading" : "readings"}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Learn more
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}

export const ModuleCard = memo(ModuleCardComponent);
