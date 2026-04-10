"use client";

import { useState } from "react";
import { useAppDispatch, newId } from "@/lib/context";
import type { SectionType } from "@/lib/types";

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "plant", label: "Plant / crop" },
  { value: "animal", label: "Animal / livestock" },
  { value: "initiative", label: "Initiative / project" },
  { value: "equipment", label: "Equipment" },
];

interface Props {
  projectId: string;
  onDone: () => void;
}

export default function AddSectionForm({ projectId, onDone }: Props) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [type, setType] = useState<SectionType>("plant");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({
      type: "ADD_SECTION",
      projectId,
      section: {
        id: newId("sec"),
        name: trimmed,
        type,
        details: {},
        items: [],
      },
    });
    onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => e.key === "Escape" && onDone()}
      className="flex items-center gap-2 px-3 py-2 border border-border-emphasized rounded bg-panel"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Section name"
        className="flex-1 text-[13px] bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as SectionType)}
        className="text-[12px] bg-raised border border-border rounded px-2 py-1 text-foreground focus:outline-none cursor-pointer"
      >
        {SECTION_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="text-[12px] px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 font-medium flex-shrink-0"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onDone}
        className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
