"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Event } from "@/lib/types";
import { RECURRENCE_META, PRIORITY_META } from "@/lib/types";
import { isEventDoneOnDate, formatDateShort } from "@/lib/calendar";
import { useAppState, useCurrentUser } from "@/lib/context";

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#a3e635",
};

interface Props {
  event: Event;
  today: string;
  onToggleDone: () => void;
  onDelete: () => void;
}

export default function EventRow({ event, today, onToggleDone, onDelete }: Props) {
  const state = useAppState();
  const currentUser = useCurrentUser();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const done = isEventDoneOnDate(event, today);
  const isOverdue = event.recurrence === "none" && event.date < today && !done;

  const assignedUsers = state.data.users.filter((u) => event.assignees?.includes(u.id));

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

      {/* Assignee dots */}
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

      {/* Delete */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {confirmDelete ? (
          <span className="flex items-center gap-1.5 text-[11px]">
            <button onClick={onDelete} className="text-destructive hover:opacity-80 font-medium">Yes</button>
            <button onClick={() => setConfirmDelete(false)} className="text-muted-foreground hover:text-foreground">No</button>
          </span>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
