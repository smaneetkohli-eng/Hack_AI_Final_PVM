"use client";

import {
  Plus,
  FolderOpen,
  ChevronRight,
  MoreHorizontal,
  Pin,
  Trash2,
  User,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getProgressPercent } from "@/lib/roadmapUtils";
import { useCallback, useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { DBNode } from "@/types";

export function Sidebar() {
  const {
    user,
    profile,
    skills,
    activeSkillId,
    setActiveSkillId,
    setShowSkillIntakeModal,
    setShowProfilePage,
    nodes,
    setNodes,
    setSelectedNodeId,
    setChatMessages,
    removeSkill,
    isSidebarOpen,
    pinnedSkillIds,
    pinSkill,
    unpinSkill,
    expandedSkillId,
    setExpandedSkillId,
  } = useAppStore();

  const [menuSkillId, setMenuSkillId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isProfileBarHovered, setIsProfileBarHovered] = useState(false);
  const [isNewSkillHovered, setIsNewSkillHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName =
    (profile?.metadata?.display_name as string) ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl = (profile?.metadata?.avatar_url as string) || "";
  const initials =
    displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuSkillId(null);
      }
    };
    if (menuSkillId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuSkillId]);

  const handleSelectSkill = useCallback(
    async (skillId: string) => {
      setShowProfilePage(false);

      if (expandedSkillId === skillId) {
        setExpandedSkillId(null);
        setActiveSkillId(null);
        setNodes([]);
        setChatMessages([]);
        setSelectedNodeId(null);
        return;
      }

      setExpandedSkillId(skillId);
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
    [
      expandedSkillId,
      setActiveSkillId,
      setSelectedNodeId,
      setNodes,
      setChatMessages,
      setExpandedSkillId,
      setShowProfilePage,
    ]
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
    if (expandedSkillId === skillId) setExpandedSkillId(null);
    setDeleteTarget(null);
  };

  const handleMenuOpen = (
    e: React.MouseEvent,
    skillId: string
  ) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ x: rect.right + 4, y: rect.top });
    setMenuSkillId(skillId === menuSkillId ? null : skillId);
  };

  const handlePin = async (skillId: string) => {
    const isPinned = pinnedSkillIds.includes(skillId);
    if (isPinned) {
      unpinSkill(skillId);
    } else {
      pinSkill(skillId);
    }

    if (user && profile) {
      const supabase = createClient();
      const newPinned = isPinned
        ? pinnedSkillIds.filter((id) => id !== skillId)
        : [...pinnedSkillIds, skillId];
      await supabase
        .from("user_profiles")
        .update({
          metadata: { ...profile.metadata, pinned_skill_ids: newPinned },
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }
    setMenuSkillId(null);
  };

  const sortedSkills = [...skills].sort((a, b) => {
    const aPinned = pinnedSkillIds.includes(a.id);
    const bPinned = pinnedSkillIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  return (
    <>
      <aside
        className={`
          w-60 flex flex-col
          transition-transform duration-300 ease-out
          fixed lg:relative inset-y-0 left-0 z-40
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          m-3 lg:my-3 lg:ml-3
          glass-panel rounded-2xl
          overflow-hidden
        `}
      >
        {/* Profile Section */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-3 mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary-light">
                  {initials}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1a1a1a] truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
          </div>

          {/* View Profile Bar */}
          <button
            onClick={() => setShowProfilePage(true)}
            onMouseEnter={() => setIsProfileBarHovered(true)}
            onMouseLeave={() => setIsProfileBarHovered(false)}
            className="w-full h-9 rounded-full bg-white/25 hover:bg-white/40
              transition-colors duration-200 flex items-center justify-center overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2">
              <User
                className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isProfileBarHovered ? "text-primary-light" : "text-muted"
                }`}
              />
              <span
                className="whitespace-nowrap overflow-hidden text-xs font-medium text-primary-light
                  transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  maxWidth: isProfileBarHovered ? 120 : 0,
                  opacity: isProfileBarHovered ? 1 : 0,
                }}
              >
                View Profile
              </span>
            </div>
          </button>
        </div>

        {/* New Skill - below divider */}
        <div className="px-4 py-3">
          <button
            onClick={() => setShowSkillIntakeModal(true)}
            onMouseEnter={() => setIsNewSkillHovered(true)}
            onMouseLeave={() => setIsNewSkillHovered(false)}
            className="w-full h-9 rounded-full bg-primary/15 hover:bg-primary/20
              transition-colors duration-200 flex items-center justify-center overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2">
              <Plus
                className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isNewSkillHovered ? "text-primary-light" : "text-primary-light/70"
                }`}
              />
              <span
                className="whitespace-nowrap overflow-hidden text-xs font-medium text-primary-light
                  transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                  maxWidth: isNewSkillHovered ? 100 : 0,
                  opacity: isNewSkillHovered ? 1 : 0,
                }}
              >
                New Skill
              </span>
            </div>
          </button>
        </div>

        {/* Skills List */}
        <div className="flex-1 overflow-y-auto py-2">
          {skills.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted text-sm">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No skills yet.</p>
              <p className="text-xs mt-1">Create one to get started!</p>
            </div>
          ) : (
            sortedSkills.map((skill) => {
              const skillNodes = nodes.filter((n) => n.skill_id === skill.id);
              const progress = getProgressPercent(skillNodes);
              const isActive = skill.id === activeSkillId;
              const isExpanded = skill.id === expandedSkillId;
              const isPinned = pinnedSkillIds.includes(skill.id);

              return (
                <div key={skill.id} className="px-2">
                  <button
                    onClick={() => handleSelectSkill(skill.id)}
                    className={`
                      w-full text-left px-4 py-3 flex items-center gap-3 rounded-full
                      transition-all duration-200 group
                      ${isActive ? "bg-[#1a1a1a] text-white shadow-sm" : "hover:bg-white/30 text-[#1a1a1a]"}
                    `}
                  >
                    <ChevronRight
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? "rotate-90" : ""
                      } ${isActive ? "text-white/80" : "text-muted"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`text-sm font-medium truncate ${
                            isActive ? "text-white" : "text-[#1a1a1a]"
                          }`}
                        >
                          {skill.name}
                        </p>
                        {isPinned && (
                          <Pin className={`w-3 h-3 flex-shrink-0 rotate-45 ${isActive ? "text-white/80" : "text-primary-light"}`} />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-2 pl-11 pr-2">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={progress} className="flex-1" />
                        <span className="text-xs text-muted tabular-nums w-8 text-right">
                          {progress}%
                        </span>
                        <button
                          onClick={(e) => handleMenuOpen(e, skill.id)}
                          className="p-1 rounded hover:bg-surface-lighter text-muted
                            hover:text-foreground transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Three-dot Menu Popover */}
      {menuSkillId && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setMenuSkillId(null)}
          />
          <div
            ref={menuRef}
            className="fixed z-50 glass-panel-strong rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] py-1 min-w-[160px]"
            style={{ top: menuPos.y, left: menuPos.x }}
          >
            <button
              onClick={() => handlePin(menuSkillId)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface-light transition-colors"
            >
              <Pin className={`w-4 h-4 ${pinnedSkillIds.includes(menuSkillId) ? "text-primary-light" : ""}`} />
              {pinnedSkillIds.includes(menuSkillId) ? "Unpin" : "Pin to Top"}
            </button>
            <button
              onClick={() => {
                setDeleteTarget(menuSkillId);
                setMenuSkillId(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-surface-light transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Skill
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Skill?"
        message="This will permanently delete this skill and all its roadmap data, notes, and resources. This action cannot be undone."
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
