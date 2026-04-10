"use client";

import { useState } from "react";
import { useAppDispatch, newId } from "@/lib/context";
import type { SectionType, ItemStatus } from "@/lib/types";
import { todayStr } from "@/lib/calendar";

const VARIETY_PLACEHOLDER: Record<SectionType, string> = {
  plant: "Cultivar / variety",
  animal: "Breed",
  equipment: "Model / make",
  initiative: "Type",
};

const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "planned", label: "Planned" },
  { value: "completed", label: "Done" },
  { value: "archived", label: "Archived" },
];

interface Props {
  projectId: string;
  sectionId: string;
  sectionType: SectionType;
  onDone: () => void;
}

export default function AddItemForm({ projectId, sectionId, sectionType, onDone }: Props) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [variety, setVariety] = useState("");
  const [qty, setQty] = useState("1");
  const [date, setDate] = useState(todayStr());
  const [status, setStatus] = useState<ItemStatus>("active");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({
      type: "ADD_ITEM",
      projectId,
      sectionId,
      item: {
        id: newId("item"),
        name: trimmed,
        variety: variety.trim(),
        qty: Math.max(1, parseInt(qty) || 1),
        date,
        notes: "",
        status,
      },
    });
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => e.key === "Escape" && onDone()}
      className="flex flex-col gap-2"
    >
      <div className="grid grid-cols-[1fr_1fr_3rem_7rem_6rem] gap-2 items-center">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="text-[12px] bg-raised border border-border-emphasized rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
        />
        <input
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
          placeholder={VARIETY_PLACEHOLDER[sectionType]}
          className="text-[12px] bg-raised border border-border-emphasized rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
        />
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          min="1"
          className="text-[12px] bg-raised border border-border-emphasized rounded px-2 py-1 text-foreground focus:outline-none focus:border-ring font-mono tabular-nums text-center"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-[11px] bg-raised border border-border-emphasized rounded px-2 py-1 text-foreground focus:outline-none focus:border-ring font-mono"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ItemStatus)}
          className="text-[11px] bg-raised border border-border-emphasized rounded px-1.5 py-1 text-foreground focus:outline-none cursor-pointer"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="text-[12px] px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 font-medium"
        >
          Add item
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
