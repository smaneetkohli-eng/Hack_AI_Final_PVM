"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AgentBubble } from "@/components/layout/AgentBubble";
import { RoadmapGraph } from "@/components/modules/RoadmapGraph";
import { PeekPanel } from "@/components/modules/PeekPanel";
import { ModuleView } from "@/components/modules/ModuleView";
import { ProfileSetupModal } from "@/components/modals/ProfileSetupModal";
import { SkillIntakeModal } from "@/components/modals/SkillIntakeModal";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase";
import type { DBNode } from "@/types";

export default function DashboardPage() {
  const {
    setUser,
    setProfile,
    setSkills,
    setNodes,
    setShowProfileModal,
    setPinnedSkillIds,
    selectedNodeId,
    setSelectedNodeId,
    activeSkillId,
    peekPanelNodeId,
    setPeekPanelNodeId,
    showProfilePage,
  } = useAppStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser({ id: user.id, email: user.email || "" });

      const [profileRes, skillsRes] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("skills")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        const pinned = profileRes.data.metadata?.pinned_skill_ids;
        if (Array.isArray(pinned)) {
          setPinnedSkillIds(pinned);
        }
        if (!profileRes.data.profile_complete) {
          setShowProfileModal(true);
        }
      } else {
        setShowProfileModal(true);
      }

      if (skillsRes.data) {
        setSkills(skillsRes.data);
      }

      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (activeSkillId) {
      const loadModules = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("nodes")
          .select("*")
          .eq("skill_id", activeSkillId)
          .order("module_order", { ascending: true });
        if (data) setNodes(data as DBNode[]);
      };
      loadModules();
    }
  }, [activeSkillId, setNodes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {showProfilePage ? (
              <ProfilePage key="profile" />
            ) : selectedNodeId ? (
              <ModuleView key="module" />
            ) : activeSkillId ? (
              <div key="roadmap" className="flex-1 flex flex-col relative">
                <RoadmapGraph />
                <AnimatePresence>
                  {peekPanelNodeId && (
                    <PeekPanel
                      nodeId={peekPanelNodeId}
                      onClose={() => setPeekPanelNodeId(null)}
                      onDiveDeeper={() => {
                        setSelectedNodeId(peekPanelNodeId);
                        setPeekPanelNodeId(null);
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div
                key="empty"
                className="flex-1 flex items-center justify-center"
              >
                <p className="text-sm text-muted/60 text-center max-w-[240px]">
                  Open a skill roadmap or create one
                </p>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AgentBubble />

      <ProfileSetupModal />
      <SkillIntakeModal />
    </div>
  );
}
