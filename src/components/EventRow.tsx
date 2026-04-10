"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import type { Event, Recurrence, Priority } from "@/lib/types";
import { RECURRENCE_META, PRIORITY_META } from "@/lib/types";
import { isEventDoneOnDate, formatDateShort } from "@/lib/calendar";
import { useAppState, useAppDispatch, useCurrentUser } from "@/lib/context";

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#a3e635",
};

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "high",   label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low",    label: "Low" },
];

const RECURRENCES = (Object.entries(RECURRENCE_META) as [Recurrence, { label: string }][]).map(
  ([value, meta]) => ({ value, label: meta.label })
);

interface Props {
  event: Event;
  today: string;
  projectId: string;
  onToggleDone: () => void;
  onDelete: () => void;
}

export default function EventRow({ event, today, projectId, onToggleDone, onDelete }: Props) {
  const state       = useAppState();
  const dispatch    = useAppDispatch();
  const currentUser = useCurrentUser();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing,       setEditing]       = useState(false);

  // Edit form state
  const [title,      setTitle]      = useState(event.title);
  const [date,       setDate]       = useState(event.date);
  const [recurrence, setRecurrence] = useState<Recurrence>(event.recurrence);
  const [priority,   setPriority]   = useState<Priority>(event.priority);
  const [notes,      setNotes]      = useState(event.notes);
  const [assignees,  setAssignees]  = useState<string[]>(event.assignees ?? []);

  const done      = isEventDoneOnDate(event, today);
  const isOverdue = event.recurrence === "none" && event.date < today && !done;
  const assignedUsers = state.data.users.filter((u) => event.assignees?.includes(u.id));

  function startEdit() {
    setTitle(event.title);
    setDate(event.date);
    setRecurrence(event.recurrence);
    setPriority(event.priority);
    setNotes(event.notes);
    setAssignees(event.assignees ?? []);
    setEditing(true);
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    dispatch({
      type: "UPDATE_EVENT",
      projectId,
      eventId: event.id,
      updates: { title: trimmed, date, recurrence, priority, notes: notes.trim(), assignees },
    });
    setEditing(false);
  }

  function toggleAssignee(userId: string) {
    setAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  if (editing) {
    return (
      <form
        onSubmit={saveEdit}
        onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
        className="flex flex-col gap-2 border border-border-emphasized rounded bg-panel px-3 py-2.5 my-0.5"
      >
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-[13px] bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none border-b border-border pb-1.5"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-[11px] bg-raised border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:border-ring font-mono"
          />
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as Recurrence)}
            className="text-[12px] bg-raised border border-border rounded px-2 py-1 text-foreground focus:outline-none cursor-pointer"
          >
            {RECURRENCES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="text-[12px] bg-raised border border-border rounded px-2 py-1 text-foreground focus:outline-none cursor-pointer"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label} priority</option>
            ))}
          </select>
        </div>

        {state.data.users.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">Assign to:</span>
            {state.data.users.map((user) => {
              const assigned = assignees.includes(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleAssignee(user.id)}
                  className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border transition-colors"
                  style={
                    assigned
                      ? { borderColor: user.color, color: user.color, backgroundColor: user.color + "22" }
                      : { borderColor: "#333", color: "#888" }
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: assigned ? user.color : "#555" }} />
                  {user.name}
                </button>
              );
            })}
          </div>
        )}

        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="text-[12px] bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none border-b border-border pb-1"
        />

        <div className="flex gap-2 pt-0.5">
          <button type="submit" className="text-[12px] px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 font-medium">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={`group flex items-center gap-2 px-1 py-[6px] border-b border-border last:border-b-0 hover:bg-raised transition-colors ${done ? "opacity-50" : ""}`}>
      {/* Priority dot */}
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: PRIORITY_COLORS[event.priority] }}
        title={PRIORITY_META[event.priority].label + " priority"}
      />

      {/* Done checkbox */}
      <input
        type="checkbox"
        checked={done}
        onChange={onToggleDone}
        className="w-3.5 h-3.5 rounded-sm flex-shrink-0 cursor-pointer accent-primary"
      />

      {/* Title */}
      <span className={`flex-1 text-[13px] truncate ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {event.title}
      </span>

      {/* Assignee badges */}
      {assignedUsers.length > 0 && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {assignedUsers.map((u) => (
            <span
              key={u.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ color: u.color, backgroundColor: u.color + "22" }}
              title={u.name}
            >
              {u.name}
            </span>
          ))}
        </div>
      )}

      {/* Date */}
      <span className={`text-[11px] font-mono tabular-nums flex-shrink-0 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
        {formatDateShort(event.date)}
      </span>

      {/* Recurrence badge */}
      {event.recurrence !== "none" && (
        <span className="text-[10px] text-muted-foreground bg-surface px-1.5 py-0.5 rounded-sm font-mono flex-shrink-0">
          {RECURRENCE_META[event.recurrence].label}
        </span>
      )}

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 flex-shrink-0">
        {confirmDelete ? (
          <span className="flex items-center gap-1.5 text-[11px]">
            <button onClick={onDelete} className="text-destructive hover:opacity-80 font-medium">Yes</button>
            <button onClick={() => setConfirmDelete(false)} className="text-muted-foreground hover:text-foreground">No</button>
          </span>
        ) : (
          <>
            <button onClick={startEdit} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
              <Pencil size={11} />
            </button>
            <button onClick={() => setConfirmDelete(true)} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 size={11} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
