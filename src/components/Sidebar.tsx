"use client";

import { useState } from "react";
import { CalendarDays, Sun, ShoppingCart, Plus, Menu, X, Pencil, Check } from "lucide-react";
import { useAppState, useAppDispatch, useCurrentUser, newId } from "@/lib/context";
import { getProjectColor } from "@/lib/colors";
import type { ViewId } from "@/lib/types";

interface Props {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const me       = useCurrentUser();

  const [collapsed,      setCollapsed]      = useState(false);
  const [addingProject,  setAddingProject]  = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingName,    setEditingName]    = useState(false);
  const [nameDraft,      setNameDraft]      = useState("");
  const [filterUserId,   setFilterUserId]   = useState<string | null>(null);

  const peopleWithProjects = state.data.users.filter((u) =>
    state.data.projects.some((p) => p.members.includes(u.id))
  );

  const visibleProjects = filterUserId
    ? state.data.projects.filter((p) => p.members.length === 0 || p.members.includes(filterUserId))
    : state.data.projects;

  function navigate(view: ViewId, projectId?: string) {
    dispatch({ type: "SET_VIEW", view, projectId });
    onMobileClose();
  }

  function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    dispatch({
      type: "ADD_PROJECT",
      project: {
        id: newId("proj"), name, icon: "📁", color: "lime", notes: "",
        members: [], sections: [], events: [], messages: [], createdAt: new Date().toISOString(),
      },
    });
    setNewProjectName(""); setAddingProject(false);
  }

  function commitName() {
    const name = nameDraft.trim();
    if (name) dispatch({ type: "SET_MY_PROFILE", updates: { name } });
    setEditingName(false);
  }

  const isActive = (view: ViewId, projectId?: string) => {
    if (state.activeView !== view) return false;
    if (projectId) return state.activeProjectId === projectId;
    return true;
  };

  function Content({ onClose }: { onClose: () => void }) {
    return (
      <>
        {/* Header — logo + your identity */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border flex-shrink-0">
          <span className="text-[13px] font-semibold text-foreground tracking-tight select-none flex-1">🌿 Grove</span>

          {/* Your name — click to rename */}
          {me && (
            editingName ? (
              <form onSubmit={(e) => { e.preventDefault(); commitName(); }} className="flex items-center gap-1">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => { if (e.key === "Escape") setEditingName(false); }}
                  className="text-[12px] bg-panel border border-border-emphasized rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:border-ring w-20"
                />
                <button type="submit" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Check size={11} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => { setNameDraft(me.name); setEditingName(true); }}
                className="group flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                title="Click to rename"
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: me.color }} />
                <span>{me.name}</span>
                <Pencil size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )
          )}

          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors ml-1">
            <X size={12} />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 pt-2 pb-1 flex flex-col gap-0.5 flex-shrink-0">
          <NavItem icon={<Sun size={13} />}          label="Today"    active={isActive("today")}    onClick={() => navigate("today")} />
          <NavItem icon={<CalendarDays size={13} />} label="Calendar" active={isActive("calendar")} onClick={() => navigate("calendar")} />
          <NavItem icon={<ShoppingCart size={13} />} label="To Buy"   active={isActive("shopping")} onClick={() => navigate("shopping")} />
        </nav>

        <div className="mx-3 my-1 border-t border-border flex-shrink-0" />

        {/* Projects */}
        <div className="px-3 pt-1 pb-0.5 flex-shrink-0">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Projects</span>
        </div>

        {/* Person filter chips */}
        {peopleWithProjects.length > 0 && (
          <div className="px-2 pb-1.5 flex flex-wrap gap-1 flex-shrink-0">
            <FilterChip label="All" active={filterUserId === null} color="#888" onClick={() => setFilterUserId(null)} />
            {peopleWithProjects.map((u) => (
              <FilterChip
                key={u.id}
                label={u.name}
                active={filterUserId === u.id}
                color={u.color}
                onClick={() => setFilterUserId(filterUserId === u.id ? null : u.id)}
              />
            ))}
          </div>
        )}

        <div className="px-2 flex flex-col gap-0.5 flex-1 overflow-y-auto">
          {visibleProjects.map((project) => {
            const active = isActive("project", project.id);
            const pc = getProjectColor(project.color);
            return (
              <button key={project.id} onClick={() => navigate("project", project.id)}
                className="group flex items-center gap-2 py-[5px] rounded text-left w-full transition-colors"
                style={active ? { backgroundColor: pc.bg, borderLeft: `2px solid ${pc.hex}`, paddingLeft: "6px" } : { borderLeft: "2px solid transparent", paddingLeft: "6px" }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a1a1a"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pc.hex }} />
                <span className="flex-1 text-[13px] truncate" style={{ color: active ? pc.text : "#FAFAFA" }}>
                  {project.icon} {project.name}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground tabular-nums pr-1">{project.sections.length}</span>
              </button>
            );
          })}
        </div>

        {/* Add project */}
        <div className="px-2 pb-4 mt-1 flex-shrink-0">
          {addingProject ? (
            <form onSubmit={handleAddProject} className="flex gap-1">
              <input autoFocus value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setAddingProject(false); setNewProjectName(""); } }}
                placeholder="Project name"
                className="flex-1 text-[12px] bg-panel border border-border-emphasized rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring min-w-0"
              />
              <button type="submit" className="text-[11px] px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 font-medium">Add</button>
            </form>
          ) : (
            <button onClick={() => setAddingProject(true)} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 w-full">
              <Plus size={12} /> Add project
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <Content onClose={onMobileClose} />
        </div>
      )}
      {collapsed && (
        <div className="hidden md:flex w-10 flex-shrink-0 border-r border-border flex-col items-center py-3 gap-2 bg-background">
          <button onClick={() => setCollapsed(false)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors">
            <Menu size={14} />
          </button>
        </div>
      )}
      {!collapsed && (
        <aside className="hidden md:flex w-[210px] flex-shrink-0 border-r border-border flex-col bg-background overflow-hidden">
          <Content onClose={() => setCollapsed(true)} />
        </aside>
      )}
    </>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-2 py-[5px] rounded text-[13px] w-full text-left transition-colors ${active ? "bg-raised text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-raised"}`}>
      {icon}{label}
    </button>
  );
}

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] px-1.5 py-0.5 rounded-sm font-medium transition-colors"
      style={
        active
          ? { backgroundColor: color + "33", color, border: `1px solid ${color}66` }
          : { backgroundColor: "transparent", color: "#555", border: "1px solid #2a2a2a" }
      }
    >
      {label}
    </button>
  );
}
