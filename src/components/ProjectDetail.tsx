"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useActiveProject, useAppDispatch, useAppState, useCurrentUser, newId } from "@/lib/context";
import { getProjectColor } from "@/lib/colors";
import { todayStr } from "@/lib/calendar";
import SectionCard from "@/components/SectionCard";
import EventRow from "@/components/EventRow";
import AddSectionForm from "@/components/AddSectionForm";
import AddEventForm from "@/components/AddEventForm";

const PERSON_COLORS = ["#60a5fa", "#fb923c", "#a78bfa", "#2dd4bf", "#f59e0b", "#f472b6"];

export default function ProjectDetail() {
  const project     = useActiveProject();
  const dispatch    = useAppDispatch();
  const state       = useAppState();
  const currentUser = useCurrentUser();

  const [editingNotes,          setEditingNotes]          = useState(false);
  const [notesValue,            setNotesValue]            = useState("");
  const [addingSection,         setAddingSection]         = useState(false);
  const [addingEvent,           setAddingEvent]           = useState(false);
  const [confirmDeleteProject,  setConfirmDeleteProject]  = useState(false);
  const [addingMember,          setAddingMember]          = useState(false);
  const [newMemberName,         setNewMemberName]         = useState("");

  if (!project) {
    return (
      <div className="p-6 text-muted-foreground text-sm">No project selected.</div>
    );
  }

  const pc = getProjectColor(project.color);
  const today = todayStr();
  const totalItems = project.sections.reduce((n, s) => n + s.items.length, 0);
  const upcomingEvents = project.events.filter(
    (e) => e.recurrence !== "none" || e.date >= today
  ).length;

  function startEditNotes() {
    setNotesValue(project!.notes);
    setEditingNotes(true);
  }

  function deleteProject() {
    dispatch({ type: "DELETE_PROJECT", projectId: project!.id });
  }

  function saveNotes() {
    dispatch({
      type: "UPDATE_PROJECT",
      projectId: project!.id,
      updates: { notes: notesValue },
    });
    setEditingNotes(false);
  }

  function deleteEvent(eventId: string) {
    dispatch({ type: "DELETE_EVENT", projectId: project!.id, eventId });
  }

  function addMember(userId: string) {
    const members = project!.members ?? [];
    if (members.includes(userId)) return;
    dispatch({ type: "UPDATE_PROJECT", projectId: project!.id, updates: { members: [...members, userId] } });
  }

  function removeMember(userId: string) {
    dispatch({
      type: "UPDATE_PROJECT",
      projectId: project!.id,
      updates: { members: (project!.members ?? []).filter((id) => id !== userId) },
    });
  }

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    const name = newMemberName.trim();
    if (!name) return;
    // Reuse existing user by name (case-insensitive) or create a new one
    const existing = state.data.users.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      addMember(existing.id);
    } else {
      const existingCount = state.data.users.length;
      const color = PERSON_COLORS[existingCount % PERSON_COLORS.length];
      const newUser = { id: newId("user"), name, color };
      dispatch({ type: "ADD_PERSON", user: newUser });
      // members update happens after ADD_PERSON via a second dispatch
      dispatch({ type: "UPDATE_PROJECT", projectId: project!.id, updates: { members: [...(project!.members ?? []), newUser.id] } });
    }
    setNewMemberName(""); setAddingMember(false);
  }

  function toggleEventDone(eventId: string) {
    dispatch({
      type: "TOGGLE_EVENT_DONE",
      projectId: project!.id,
      eventId,
      dateStr: today,
      userId: currentUser?.id ?? "",
    });
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div
        className="px-6 py-4 border-b border-border flex items-start justify-between gap-4"
        style={{ borderLeft: `3px solid ${pc.hex}` }}
      >
        <div>
          <h1 className="text-[22px] font-semibold text-foreground leading-tight">
            {project.icon} {project.name}
          </h1>
          <p className="text-[12px] text-muted-foreground font-mono mt-0.5">
            {project.sections.length} sections · {totalItems} items ·{" "}
            {upcomingEvents} upcoming events
          </p>
        </div>

        {/* Delete project */}
        <div className="flex items-center gap-2 pt-1 flex-shrink-0">
          {confirmDeleteProject ? (
            <span className="flex items-center gap-2 text-[12px]">
              <span className="text-muted-foreground">Delete project?</span>
              <button
                onClick={deleteProject}
                className="text-destructive hover:opacity-80 font-medium"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDeleteProject(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                No
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDeleteProject(true)}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-raised"
              title="Delete project"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-6">
        {/* Notes */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Notes
            </span>
            {!editingNotes && (
              <button
                onClick={startEditNotes}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingNotes ? (
            <div className="flex flex-col gap-2">
              <textarea
                autoFocus
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={4}
                className="w-full bg-panel border border-border-emphasized rounded px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
                placeholder="What are we working with — varieties, setup, goals, overall status…"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveNotes}
                  className="text-[12px] px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingNotes(false)}
                  className="text-[12px] px-3 py-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              onClick={startEditNotes}
              className="text-[13px] text-foreground leading-relaxed cursor-text min-h-[32px] hover:text-foreground/80 transition-colors"
            >
              {project.notes || (
                <span className="text-muted-foreground italic">
                  No notes yet — click to add
                </span>
              )}
            </p>
          )}
        </section>

        {/* People */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">People</span>
            {!addingMember && (
              <button onClick={() => setAddingMember(true)} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                Add
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {(project.members ?? []).length === 0 && !addingMember && (
              <span className="text-[12px] text-muted-foreground italic">Everyone — add people to restrict</span>
            )}
            {(project.members ?? []).map((userId) => {
              const user = state.data.users.find((u) => u.id === userId);
              if (!user) return null;
              return (
                <span key={userId} className="group flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-sm font-medium" style={{ backgroundColor: user.color + "22", color: user.color }}>
                  {user.name}
                  <button onClick={() => removeMember(userId)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-white">
                    <X size={9} />
                  </button>
                </span>
              );
            })}

            {/* Existing users not yet members — quick-add chips */}
            {state.data.users
              .filter((u) => !(project.members ?? []).includes(u.id))
              .map((u) => (
                <button
                  key={u.id}
                  onClick={() => addMember(u.id)}
                  title={`Add ${u.name}`}
                  className="text-[11px] px-1.5 py-0.5 rounded-sm border border-dashed transition-colors hover:border-solid"
                  style={{ color: "#555", borderColor: "#333" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = u.color; (e.currentTarget as HTMLElement).style.borderColor = u.color + "88"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; (e.currentTarget as HTMLElement).style.borderColor = "#333"; }}
                >
                  + {u.name}
                </button>
              ))}

            {addingMember && (
              <form onSubmit={handleAddMember} className="flex gap-1">
                <input
                  autoFocus
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { setAddingMember(false); setNewMemberName(""); } }}
                  placeholder="Name"
                  className="text-[12px] bg-panel border border-border-emphasized rounded px-2 py-0.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring w-28"
                />
                <button type="submit" className="text-[11px] px-2 py-0.5 bg-primary text-primary-foreground rounded hover:opacity-90 font-medium">Add</button>
                <button type="button" onClick={() => { setAddingMember(false); setNewMemberName(""); }} className="text-[11px] text-muted-foreground hover:text-foreground px-1">✕</button>
              </form>
            )}
          </div>
        </section>

        {/* Sections */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Sections
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {project.sections.map((section) => (
              <SectionCard
                key={section.id}
                projectId={project.id}
                section={section}
                projectColor={pc}
              />
            ))}

            {addingSection ? (
              <AddSectionForm
                projectId={project.id}
                onDone={() => setAddingSection(false)}
              />
            ) : (
              <button
                onClick={() => setAddingSection(true)}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-1 py-1 w-fit"
              >
                <Plus size={12} />
                Add section
              </button>
            )}
          </div>
        </section>

        {/* Events */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Events
            </span>
          </div>

          <div className="flex flex-col">
            {project.events.length === 0 && !addingEvent && (
              <p className="text-[12px] text-muted-foreground py-1">
                No events yet.
              </p>
            )}

            {project.events
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  today={today}
                  onToggleDone={() => toggleEventDone(event.id)}
                  onDelete={() => deleteEvent(event.id)}
                />
              ))}

            {addingEvent ? (
              <AddEventForm
                projectId={project.id}
                defaultDate={today}
                onDone={() => setAddingEvent(false)}
              />
            ) : (
              <button
                onClick={() => setAddingEvent(true)}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-1 py-1 mt-1 w-fit"
              >
                <Plus size={12} />
                Add event
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
