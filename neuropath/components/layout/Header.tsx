"use client";

import { Brain, Settings, Menu } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function Header() {
  const { user, isSidebarOpen, setIsSidebarOpen } = useAppStore();

  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-xl flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-surface-light transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5 text-muted" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-light" />
          </div>
          <h1 className="font-display text-lg font-bold tracking-tight">
            <span className="text-foreground">Neuro</span>
            <span className="text-primary-light">Path</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-surface-light transition-colors">
          <Settings className="w-5 h-5 text-muted" />
        </button>
        {user && (
          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-semibold text-primary-light">
            {user.email?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
      </div>
    </header>
  );
}
