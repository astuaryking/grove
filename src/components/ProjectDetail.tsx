"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useActiveProject, useAppDispatch, useCurrentUser, newId } from "@/lib/context";
import { getProjectColor } from "@/lib/colors";
import { todayStr } from "@/lib/calendar";
import SectionCard from "@/components/SectionCard";
import EventRow from "@/components/EventRow";
import AddSectionForm from "@/components/AddSectionForm";
import AddEventForm from "@/components/AddEventForm";

export default function ProjectDetail() {
  const project = useActiveProject();
  const dispatch = useAppDispatch();
  const currentUser = useCurrentUser();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

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
