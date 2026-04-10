"use client";

import { useState } from "react";
import { useAppDispatch, newId } from "@/lib/context";
import type { Recurrence, Priority } from "@/lib/types";
import { RECURRENCE_META } from "@/lib/types";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const RECURRENCES = (Object.entries(RECURRENCE_META) as [Recurrence, { label: string }][]).map(
  ([value, meta]) => ({ value, label: meta.label })
);

interface Props {
  projectId: string;
  defaultDate: string;
  sectionId?: string;
  onDone: () => void;
}

export default function AddEventForm({ projectId, defaultDate, sectionId, onDone }: Props) {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [priority, setPriority] = useState<Priority>("medium");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    dispatch({
      type: "ADD_EVENT",
      projectId,
      event: {
        id: newId("ev"),
        title: trimmed,
        date,
        recurrence,
        priority,
        projectId,
        sectionId,
        notes: notes.trim(),
        completions: [],
      },
    });
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => e.key === "Escape" && onDone()}
      className="flex flex-col gap-2 border border-border-emphasized rounded bg-panel px-3 py-2.5 mt-1"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title"
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
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="text-[12px] bg-raised border border-border rounded px-2 py-1 text-foreground focus:outline-none cursor-pointer"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label} priority
            </option>
          ))}
        </select>
      </div>

      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="text-[12px] bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none border-b border-border pb-1"
      />

      <div className="flex gap-2 pt-0.5">
        <button
          type="submit"
          className="text-[12px] px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 font-medium"
        >
          Add event
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
