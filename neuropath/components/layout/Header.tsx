"use client";

import Image from "next/image";
import { Settings, Menu } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function Header() {
  const { isSidebarOpen, setIsSidebarOpen } = useAppStore();

  return (
    <header className="h-14 border-b border-black/6 bg-white flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-full hover:bg-black/5 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5 text-muted" />
        </button>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 flex items-center justify-center bg-transparent [&>span]:!bg-transparent">
            <Image
              src="/logo.png"
              alt="Tesseract"
              width={36}
              height={36}
              className="object-contain w-full h-full select-none"
              style={{ mixBlendMode: "darken" }}
              priority
              unoptimized
            />
          </div>
          <h1 className="font-brand text-lg font-semibold tracking-tight text-foreground">
            Tesseract
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-black/5 transition-colors">
          <Settings className="w-5 h-5 text-muted" />
        </button>
      </div>
    </header>
  );
}
