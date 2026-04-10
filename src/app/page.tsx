"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useAppState } from "@/lib/context";
import Sidebar from "@/components/Sidebar";
import TodayView from "@/components/TodayView";
import CalendarView from "@/components/CalendarView";
import ProjectDetail from "@/components/ProjectDetail";
import ShoppingView from "@/components/ShoppingView";

export default function Home() {
  const state = useAppState();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!state.loaded) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <span className="text-muted-foreground text-sm font-mono">loading...</span>
      </div>
    );
  }

  const viewLabel: Record<string, string> = {
    today: "Today", calendar: "Calendar", shopping: "To Buy",
    project: state.data.projects.find((p) => p.id === state.activeProjectId)?.name ?? "Project",
  };

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <Menu size={16} />
          </button>
          <span className="text-[13px] font-semibold text-foreground">🌿 Grove</span>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {state.activeView === "today"    && <TodayView />}
          {state.activeView === "calendar" && <CalendarView />}
          {state.activeView === "project"  && <ProjectDetail />}
          {state.activeView === "shopping" && <ShoppingView />}
        </div>
      </main>
    </div>
  );
}
