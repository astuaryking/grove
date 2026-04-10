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

const PERSON_COLORS = ["#60a5fa", "#fb923c", "#a78bfa", "#2dd4bf", "#f59e0b", "#f472b6"];

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const state    = useAppState();
  const dispatch = useAppDispatch();
  const me       = useCurrentUser();

  const [collapsed,         setCollapsed]         = useState(false);
  const [addingProject,     setAddingProject]     = useState(false);
  const [newProjectName,    setNewProjectName]    = useState("");
  const [addingPerson,      setAddingPerson]      = useState(false);
  const [newPersonName,     setNewPersonName]     = useState("");
  const [editingId,         setEditingId]         = useState<string | null>(null);
  const [editingName,       setEditingName]       = useState("");

  const others = state.data.users.filter((u) => u.id !== state.data.currentUserId);

  function navigate(view: ViewId, projectId?: string) {
    dispatch({ type: "SET_VIEW", view, projectId });
    onMobileClose();
  }

  function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    dispatch({ type: "ADD_PROJECT", project: { id: newId("proj"), name, icon: "📁", color: "lime", notes: "", sections: [], events: [], createdAt: new Date().toISOString() } });
    setNewProjectName(""); setAddingProject(false);
  }

  function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    const name = newPersonName.trim();
    if (!name) return;
    const color = PERSON_COLORS[others.length % PERSON_COLORS.length];
    dispatch({ type: "ADD_PERSON", user: { id: newId("user"), name, color } });
    setNewPersonName(""); setAddingPerson(false);
  }

  function commitEdit(type: "profile" | "person", userId?: string) {
    const name = editingName.trim();
    if (name) {
      if (type === "profile") dispatch({ type: "SET_MY_PROFILE", updates: { name } });
      else if (userId) dispatch({ type: "UPDATE_PERSON", userId, updates: { name } });
    }
    setEditingId(null);
  }

  function startEdit(id: string, currentName: string) {
    setEditingId(id); setEditingName(currentName);
  }

  const isActive = (view: ViewId, projectId?: string) => {
    if (state.activeView !== view) return false;
    if (projectId) return state.activeProjectId === projectId;
    return true;
  };

  function Content({ onClose }: { onClose: () => void }) {
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border flex-shrink-0">
          <span className="text-[13px] font-semibold text-foreground tracking-tight select-none">🌿 Grove</span>
          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors">
            <X size={12} />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 pt-2 pb-1 flex flex-col gap-0.5 flex-shrink-0">
          <NavItem icon={<Sun size={13} />}         label="Today"    active={isActive("today")}    onClick={() => navigate("today")} />
          <NavItem icon={<CalendarDays size={13} />} label="Calendar" active={isActive("calendar")} onClick={() => navigate("calendar")} />
          <NavItem icon={<ShoppingCart size={13} />} label="To Buy"   active={isActive("shopping")} onClick={() => navigate("shopping")} />
        </nav>

        <div className="mx-3 my-1 border-t border-border flex-shrink-0" />

        {/* Your profile */}
        <div className="px-3 pt-1 pb-0.5 flex-shrink-0">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">You</span>
        </div>
        <div className="px-2 pb-1 flex-shrink-0">
          {me && (
            <div className="group flex items-center gap-2 px-2 py-[5px] rounded hover:bg-raised transition-colors">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: me.color }} />
              {editingId === "profile" ? (
                <form onSubmit={(e) => { e.preventDefault(); commitEdit("profile"); }} className="flex-1">
                  <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => commitEdit("profile")}
                    onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                    className="w-full text-[13px] bg-panel border border-border-emphasized rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:border-ring"
                  />
                </form>
              ) : (
                <span className="flex-1 text-[13px] text-foreground font-medium truncate">{me.name}</span>
              )}
              {editingId !== "profile" && (
                <button onClick={() => startEdit("profile", me.name)} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity">
                  <Pencil size={11} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Team */}
        {(others.length > 0 || addingPerson) && (
          <>
            <div className="px-3 pt-1 pb-0.5 flex-shrink-0">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">People</span>
            </div>
            <div className="px-2 flex flex-col gap-0.5 flex-shrink-0">
              {others.map((user) => (
                <div key={user.id} className="group flex items-center gap-2 px-2 py-[5px] rounded hover:bg-raised transition-colors">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: user.color }} />
                  {editingId === user.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); commitEdit("person", user.id); }} className="flex-1">
                      <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => commitEdit("person", user.id)}
                        onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                        className="w-full text-[13px] bg-panel border border-border-emphasized rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:border-ring"
                      />
                    </form>
                  ) : (
                    <span className="flex-1 text-[13px] text-muted-foreground truncate">{user.name}</span>
                  )}
                  {editingId !== user.id && (
                    <button onClick={() => startEdit(user.id, user.name)} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity">
                      <Pencil size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add person */}
        <div className="px-2 pb-1 flex-shrink-0">
          {addingPerson ? (
            <form onSubmit={handleAddPerson} className="flex gap-1 px-1">
              <input autoFocus value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setAddingPerson(false); setNewPersonName(""); } }}
                placeholder="Name"
                className="flex-1 text-[12px] bg-panel border border-border-emphasized rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring min-w-0"
              />
              <button type="submit" className="text-[11px] px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 font-medium">Add</button>
            </form>
          ) : (
            <button onClick={() => setAddingPerson(true)} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 w-full">
              <Plus size={12} /> Add person
            </button>
          )}
        </div>

        <div className="mx-3 my-1 border-t border-border flex-shrink-0" />

        {/* Projects */}
        <div className="px-3 pt-1 pb-0.5 flex-shrink-0">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Projects</span>
        </div>

        <div className="px-2 flex flex-col gap-0.5 flex-1 overflow-y-auto">
          {state.data.projects.map((project) => {
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
