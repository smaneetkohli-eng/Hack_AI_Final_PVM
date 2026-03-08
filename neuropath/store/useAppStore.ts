import { create } from "zustand";
import type { DBNode, DBSkill, DBChatMessage, DBUserProfile } from "@/types";

interface AppState {
  user: { id: string; email: string } | null;
  setUser: (user: { id: string; email: string } | null) => void;

  profile: DBUserProfile | null;
  setProfile: (profile: DBUserProfile | null) => void;

  skills: DBSkill[];
  setSkills: (skills: DBSkill[]) => void;
  addSkill: (skill: DBSkill) => void;
  removeSkill: (id: string) => void;

  activeSkillId: string | null;
  setActiveSkillId: (id: string | null) => void;

  nodes: DBNode[];
  setNodes: (nodes: DBNode[]) => void;
  updateNodeStatus: (nodeId: string, status: DBNode["status"]) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;

  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  peekPanelNodeId: string | null;
  setPeekPanelNodeId: (id: string | null) => void;

  chatMessages: DBChatMessage[];
  setChatMessages: (messages: DBChatMessage[]) => void;
  addChatMessage: (message: DBChatMessage) => void;

  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;

  showSkillIntakeModal: boolean;
  setShowSkillIntakeModal: (show: boolean) => void;

  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;

  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;

  showProfilePage: boolean;
  setShowProfilePage: (show: boolean) => void;

  pinnedSkillIds: string[];
  setPinnedSkillIds: (ids: string[]) => void;
  pinSkill: (id: string) => void;
  unpinSkill: (id: string) => void;

  expandedSkillId: string | null;
  setExpandedSkillId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  profile: null,
  setProfile: (profile) => set({ profile }),

  skills: [],
  setSkills: (skills) => set({ skills }),
  addSkill: (skill) => set((s) => ({ skills: [...s.skills, skill] })),
  removeSkill: (id) =>
    set((s) => ({
      skills: s.skills.filter((sk) => sk.id !== id),
      pinnedSkillIds: s.pinnedSkillIds.filter((pid) => pid !== id),
    })),

  activeSkillId: null,
  setActiveSkillId: (id) => set({ activeSkillId: id }),

  nodes: [],
  setNodes: (nodes) => set({ nodes }),
  updateNodeStatus: (nodeId, status) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, status } : n)),
    })),
  updateNodePosition: (nodeId, x, y) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, position_x: x, position_y: y } : n
      ),
    })),

  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  peekPanelNodeId: null,
  setPeekPanelNodeId: (id) => set({ peekPanelNodeId: id }),

  chatMessages: [],
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) =>
    set((s) => ({ chatMessages: [...s.chatMessages, message] })),

  showProfileModal: false,
  setShowProfileModal: (show) => set({ showProfileModal: show }),

  showSkillIntakeModal: false,
  setShowSkillIntakeModal: (show) => set({ showSkillIntakeModal: show }),

  isSidebarOpen: true,
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),

  isChatOpen: true,
  setIsChatOpen: (open) => set({ isChatOpen: open }),

  showProfilePage: false,
  setShowProfilePage: (show) => set({ showProfilePage: show }),

  pinnedSkillIds: [],
  setPinnedSkillIds: (ids) => set({ pinnedSkillIds: ids }),
  pinSkill: (id) =>
    set((s) => ({
      pinnedSkillIds: s.pinnedSkillIds.includes(id)
        ? s.pinnedSkillIds
        : [...s.pinnedSkillIds, id],
    })),
  unpinSkill: (id) =>
    set((s) => ({
      pinnedSkillIds: s.pinnedSkillIds.filter((pid) => pid !== id),
    })),

  expandedSkillId: null,
  setExpandedSkillId: (id) => set({ expandedSkillId: id }),
}));
