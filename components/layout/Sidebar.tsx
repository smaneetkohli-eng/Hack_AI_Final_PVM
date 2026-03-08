"use client";

import { Plus, FolderOpen, Trash2, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getProgressPercent } from "@/lib/roadmapUtils";
import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { DBNode } from "@/types";

export function Sidebar() {
  const {
    skills,
    activeSkillId,
    setActiveSkillId,
    setShowSkillIntakeModal,
    nodes,
    setNodes,
    setSelectedNodeId,
    setChatMessages,
    removeSkill,
    isSidebarOpen,
  } = useAppStore();

  const [contextMenu, setContextMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const handleSelectSkill = useCallback(
    async (skillId: string) => {
      setActiveSkillId(skillId);
      setSelectedNodeId(null);
      const supabase = createClient();

      const [nodesRes, chatRes] = await Promise.all([
        supabase
          .from("nodes")
          .select("*")
          .eq("skill_id", skillId)
          .order("module_order", { ascending: true }),
        supabase
          .from("chat_messages")
          .select("*")
          .eq("skill_id", skillId)
          .order("created_at", { ascending: true }),
      ]);

      if (nodesRes.data) setNodes(nodesRes.data as DBNode[]);
      if (chatRes.data) setChatMessages(chatRes.data);
    },
    [setActiveSkillId, setSelectedNodeId, setNodes, setChatMessages]
  );

  const handleDelete = async (skillId: string) => {
    const supabase = createClient();
    await supabase.from("skills").delete().eq("id", skillId);
    removeSkill(skillId);
    if (activeSkillId === skillId) {
      setActiveSkillId(null);
      setNodes([]);
      setChatMessages([]);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, skillId: string) => {
    e.preventDefault();
    setContextMenu({ id: skillId, x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <aside
        className={`
          w-60 border-r border-border bg-surface flex flex-col
          transition-transform duration-300 ease-out
          fixed lg:relative inset-y-0 left-0 z-40
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-4 border-b border-border">
          <button
            onClick={() => setShowSkillIntakeModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
              bg-primary/10 hover:bg-primary/20 text-primary-light
              transition-colors duration-200 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Skill
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {skills.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted text-sm">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No skills yet.</p>
              <p className="text-xs mt-1">Create one to get started!</p>
            </div>
          ) : (
            skills.map((skill) => {
              const skillNodes = nodes.filter((n) => n.skill_id === skill.id);
              const progress = getProgressPercent(skillNodes);
              const isActive = skill.id === activeSkillId;

              return (
                <button
                  key={skill.id}
                  onClick={() => handleSelectSkill(skill.id)}
                  onContextMenu={(e) => handleContextMenu(e, skill.id)}
                  className={`
                    w-full text-left px-4 py-3 flex items-center gap-3
                    transition-colors duration-150 group
                    ${isActive ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-surface-light"}
                  `}
                >
                  <ChevronRight
                    className={`w-4 h-4 text-muted transition-transform ${isActive ? "rotate-90 text-primary" : ""}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${isActive ? "text-foreground" : "text-muted"}`}
                    >
                      {skill.name}
                    </p>
                    <ProgressBar value={progress} className="mt-1.5" />
                  </div>
                  <span className="text-xs text-muted tabular-nums">
                    {progress}%
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-surface border border-border rounded-lg shadow-xl py-1 min-w-[140px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => handleDelete(contextMenu.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-light"
            >
              <Trash2 className="w-4 h-4" />
              Delete Skill
            </button>
          </div>
        </>
      )}
    </>
  );
}
