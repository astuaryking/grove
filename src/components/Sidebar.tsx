"use client";

import { useState } from "react";
import { CalendarDays, Sun, Plus, Menu, X, Check, Pencil } from "lucide-react";
import { useAppState, useAppDispatch, useCurrentUser, newId } from "@/lib/context";
import { getProjectColor } from "@/lib/colors";
import type { ViewId } from "@/lib/types";

interface Props {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const currentUser = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState("");

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
    setNewProjectName("");
    setAddingProject(false);
  }

  function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    const name = newUserName.trim();
    if (!name) return;
    const USER_COLORS = ["#60a5fa", "#fb923c", "#a78bfa", "#2dd4bf", "#f59e0b"];
    const color = USER_COLORS[state.data.users.length % USER_COLORS.length];
    dispatch({ type: "ADD_USER", user: { id: newId("user"), name, color } });
    setNewUserName("");
    setAddingUser(false);
  }

  function handleRenameUser(userId: string) {
    const name = editingUserName.trim();
    if (name) dispatch({ type: "UPDATE_USER", userId, updates: { name } });
    setEditingUserId(null);
  }

  const isActive = (view: ViewId, projectId?: string) => {
    if (state.activeView !== view) return false;
    if (projectId) return state.activeProjectId === projectId;
    return true;
  };

  function SidebarContent({ onClose }: { onClose: () => void }) {
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border flex-shrink-0">
          <span className="text-[13px] font-semibold text-foreground tracking-tight">
            🌱 Homestead
          </span>
          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors">
            <X size={12} />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 pt-2 pb-1 flex flex-col gap-0.5 flex-shrink-0">
          <NavItem icon={<Sun size={13} />} label="Today" active={isActive("today")} onClick={() => navigate("today")} />
          <NavItem icon={<CalendarDays size={13} />} label="Calendar" active={isActive("calendar")} onClick={() => navigate("calendar")} />
        </nav>

        <div className="mx-3 my-1 border-t border-border flex-shrink-0" />

        {/* Users */}
        <div className="px-3 pt-1 pb-0.5 flex-shrink-0">
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Active user
          </span>
        </div>

        <div className="px-2 flex flex-col gap-0.5 flex-shrink-0">
          {state.data.users.map((user) => {
            const isCurrent = user.id === currentUser?.id;
            return (
              <div key={user.id} className="group flex items-center gap-2 px-2 py-[5px] rounded hover:bg-raised transition-colors">
                {/* Color dot / active check */}
                <button
                  onClick={() => dispatch({ type: "SET_CURRENT_USER", userId: user.id })}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: user.color + "33", border: `1.5px solid ${user.color}` }}>
                    {isCurrent && <Check size={10} style={{ color: user.color }} />}
                  </span>
                  {editingUserId === user.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleRenameUser(user.id); }} className="flex-1">
                      <input
                        autoFocus
                        value={editingUserName}
                        onChange={(e) => setEditingUserName(e.target.value)}
                        onBlur={() => handleRenameUser(user.id)}
                        onKeyDown={(e) => { if (e.key === "Escape") setEditingUserId(null); }}
                        className="w-full text-[13px] bg-panel border border-border-emphasized rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:border-ring"
                      />
                    </form>
                  ) : (
                    <span className={`text-[13px] truncate ${isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {user.name}
                    </span>
                  )}
                </button>
                {/* Rename button */}
                {editingUserId !== user.id && (
                  <button
                    onClick={() => { setEditingUserId(user.id); setEditingUserName(user.name); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-foreground transition-opacity"
                  >
                    <Pencil size={11} />
                  </button>
                )}
              </div>
            );
          })}

          {addingUser ? (
            <form onSubmit={handleAddUser} className="flex gap-1 mt-1 px-1">
              <input
                autoFocus
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { setAddingUser(false); setNewUserName(""); } }}
                placeholder="Name"
                className="flex-1 text-[12px] bg-panel border border-border-emphasized rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring min-w-0"
              />
              <button type="submit" className="text-[11px] px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 font-medium">Add</button>
            </form>
          ) : (
            <button onClick={() => setAddingUser(true)} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 w-full">
              <Plus size={12} /> Add user
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
              <button
                key={project.id}
                onClick={() => navigate("project", project.id)}
                className="group flex items-center gap-2 py-[5px] rounded text-left w-full transition-colors"
                style={
                  active
                    ? { backgroundColor: pc.bg, borderLeft: `2px solid ${pc.hex}`, paddingLeft: "6px" }
                    : { borderLeft: "2px solid transparent", paddingLeft: "6px" }
                }
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "#1a1a1a"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pc.hex }} />
                <span className="flex-1 text-[13px] truncate" style={{ color: active ? pc.text : "#FAFAFA" }}>
                  {project.icon} {project.name}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground tabular-nums pr-1">
                  {project.sections.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add project */}
        <div className="px-2 pb-4 mt-1 flex-shrink-0">
          {addingProject ? (
            <form onSubmit={handleAddProject} className="flex gap-1 mt-1">
              <input
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
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
      {/* Mobile: full-screen overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <SidebarContent onClose={onMobileClose} />
        </div>
      )}

      {/* Desktop: collapsed icon bar */}
      {collapsed && (
        <div className="hidden md:flex w-10 flex-shrink-0 border-r border-border flex-col items-center py-3 gap-2 bg-background">
          <button onClick={() => setCollapsed(false)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors">
            <Menu size={14} />
          </button>
        </div>
      )}

      {/* Desktop: full sidebar */}
      {!collapsed && (
        <aside className="hidden md:flex w-[210px] flex-shrink-0 border-r border-border flex-col bg-background overflow-hidden">
          <SidebarContent onClose={() => setCollapsed(true)} />
        </aside>
      )}
    </>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-[5px] rounded text-[13px] w-full text-left transition-colors ${
        active ? "bg-raised text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-raised"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
