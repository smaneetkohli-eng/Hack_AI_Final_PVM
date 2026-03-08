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

  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

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
    set((s) => ({ skills: s.skills.filter((sk) => sk.id !== id) })),

  activeSkillId: null,
  setActiveSkillId: (id) => set({ activeSkillId: id }),

  nodes: [],
  setNodes: (nodes) => set({ nodes }),
  updateNodeStatus: (nodeId, status) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, status } : n)),
    })),

  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

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
}));
