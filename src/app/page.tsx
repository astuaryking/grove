"use client";

import { useAppState } from "@/lib/context";
import Sidebar from "@/components/Sidebar";
import TodayView from "@/components/TodayView";
import CalendarView from "@/components/CalendarView";
import ProjectDetail from "@/components/ProjectDetail";

export default function Home() {
  const state = useAppState();

  if (!state.loaded) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <span className="text-muted-foreground text-sm font-mono">loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        {state.activeView === "today" && <TodayView />}
        {state.activeView === "calendar" && <CalendarView />}
        {state.activeView === "project" && <ProjectDetail />}
      </main>
    </div>
  );
}
