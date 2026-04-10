"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useAppDispatch } from "@/lib/context";
import type { Item, ItemStatus, SectionType } from "@/lib/types";

const STATUS_STYLES: Record<ItemStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#a3e635", bg: "#a3e63522" },
  planned: { label: "Planned", color: "#f59e0b", bg: "#f59e0b22" },
  completed: { label: "Done", color: "#2dd4bf", bg: "#2dd4bf22" },
  archived: { label: "Archived", color: "#555555", bg: "#55555522" },
};

const VARIETY_LABEL: Record<SectionType, string> = {
  plant: "Cultivar",
  animal: "Breed",
  equipment: "Model",
  initiative: "Type",
};

interface Props {
  item: Item;
  projectId: string;
  sectionId: string;
  sectionType: SectionType;
}

export default function ItemRow({ item, projectId, sectionId, sectionType }: Props) {
  const dispatch = useAppDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = STATUS_STYLES[item.status];

  function deleteItem() {
    dispatch({ type: "DELETE_ITEM", projectId, sectionId, itemId: item.id });
  }

  return (
    <div className="group grid grid-cols-[1fr_1fr_3rem_7rem_6rem] gap-2 items-center px-3 py-[6px] hover:bg-raised border-b border-border last:border-b-0 transition-colors">
      <span className="text-[13px] text-foreground truncate">{item.name}</span>
      <span className="text-[12px] text-muted-foreground truncate">{item.variety || "—"}</span>
      <span className="text-[12px] font-mono text-muted-foreground tabular-nums">{item.qty}</span>
      <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
        {item.date ? formatDate(item.date) : "—"}
      </span>

      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm uppercase tracking-wide"
          style={{ color: status.color, backgroundColor: status.bg }}
        >
          {status.label}
        </span>

        {/* Delete */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          {confirmDelete ? (
            <span className="flex items-center gap-1.5 text-[11px]">
              <button onClick={deleteItem} className="text-destructive hover:opacity-80 font-medium">
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                No
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}
