"use client";

import { useState } from "react";
import { CalendarDays, Sun, Plus, Menu, X } from "lucide-react";
import { useAppState, useAppDispatch, newId } from "@/lib/context";
import { getProjectColor } from "@/lib/colors";
import type { ViewId } from "@/lib/types";

export default function Sidebar() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [newName, setNewName] = useState("");

  function navigate(view: ViewId, projectId?: string) {
    dispatch({ type: "SET_VIEW", view, projectId });
  }

  function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    dispatch({
      type: "ADD_PROJECT",
      project: {
        id: newId("proj"),
        name,
        icon: "📁",
        color: "lime",
        notes: "",
        sections: [],
        events: [],
        createdAt: new Date().toISOString(),
      },
    });
    setNewName("");
    setAddingProject(false);
  }

  const isActive = (view: ViewId, projectId?: string) => {
    if (state.activeView !== view) return false;
    if (projectId) return state.activeProjectId === projectId;
    return true;
  };

  if (collapsed) {
    return (
      <div className="w-10 flex-shrink-0 border-r border-border flex flex-col items-center py-3 gap-2 bg-background">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors"
          aria-label="Expand sidebar"
        >
          <Menu size={14} />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="w-[210px] flex-shrink-0 border-r border-border flex flex-col bg-background overflow-y-auto"
      style={{ minHeight: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-[13px] font-semibold text-foreground tracking-tight">
          🌱 Homestead
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors"
          aria-label="Collapse sidebar"
        >
          <X size={12} />
        </button>
      </div>

      {/* Nav */}
      <nav className="px-2 pt-2 pb-1 flex flex-col gap-0.5">
        <NavItem
          icon={<Sun size={13} />}
          label="Today"
          active={isActive("today")}
          onClick={() => navigate("today")}
        />
        <NavItem
          icon={<CalendarDays size={13} />}
          label="Calendar"
          active={isActive("calendar")}
          onClick={() => navigate("calendar")}
        />
      </nav>

      {/* Divider */}
      <div className="mx-3 my-1 border-t border-border" />

      {/* Projects */}
      <div className="px-3 pt-1 pb-0.5">
        <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Projects
        </span>
      </div>

      <div className="px-2 flex flex-col gap-0.5 flex-1">
        {state.data.projects.map((project) => {
          const active = isActive("project", project.id);
          const pc = getProjectColor(project.color);
          return (
            <button
              key={project.id}
              onClick={() => navigate("project", project.id)}
              className="group flex items-center gap-2 px-2 py-[5px] rounded text-left w-full transition-colors"
              style={
                active
                  ? {
                      backgroundColor: pc.bg,
                      borderLeft: `2px solid ${pc.hex}`,
                      paddingLeft: "6px",
                    }
                  : { borderLeft: "2px solid transparent", paddingLeft: "6px" }
              }
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "#1a1a1a";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
              }}
            >
              {/* Color dot */}
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: pc.hex }}
              />
              {/* Name */}
              <span
                className="flex-1 text-[13px] truncate"
                style={{ color: active ? pc.text : "#FAFAFA" }}
              >
                {project.icon} {project.name}
              </span>
              {/* Section count */}
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {project.sections.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add project */}
      <div className="px-2 pb-3 mt-1">
        {addingProject ? (
          <form onSubmit={handleAddProject} className="flex gap-1 mt-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setAddingProject(false);
                  setNewName("");
                }
              }}
              placeholder="Project name"
              className="flex-1 text-[12px] bg-panel border border-border-emphasized rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring min-w-0"
            />
            <button
              type="submit"
              className="text-[11px] px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 font-medium"
            >
              Add
            </button>
          </form>
        ) : (
          <button
            onClick={() => setAddingProject(true)}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 w-full"
          >
            <Plus size={12} />
            Add project
          </button>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-[5px] rounded text-[13px] w-full text-left transition-colors ${
        active
          ? "bg-raised text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-raised"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
