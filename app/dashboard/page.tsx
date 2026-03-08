"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatPanel } from "@/components/layout/ChatPanel";
import { ModuleCardGrid } from "@/components/modules/ModuleCardGrid";
import { ModuleView } from "@/components/modules/ModuleView";
import { ProfileSetupModal } from "@/components/modals/ProfileSetupModal";
import { SkillIntakeModal } from "@/components/modals/SkillIntakeModal";
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
    selectedNodeId,
    activeSkillId,
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

        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence>
            {selectedNodeId ? <ModuleView /> : <ModuleCardGrid />}
          </AnimatePresence>
        </main>

        <ChatPanel />
      </div>

      <ProfileSetupModal />
      <SkillIntakeModal />
    </div>
  );
}
