"use client";

import { useState } from "react";
import { ChevronRight, Trash2, Plus } from "lucide-react";
import { useAppDispatch, newId } from "@/lib/context";
import type { Section, SectionType } from "@/lib/types";
import type { ProjectColor } from "@/lib/colors";
import ItemRow from "@/components/ItemRow";
import AddItemForm from "@/components/AddItemForm";

const TYPE_LABELS: Record<SectionType, string> = {
  plant: "Plant",
  animal: "Animal",
  initiative: "Initiative",
  equipment: "Equipment",
};

const TYPE_COLORS: Record<SectionType, string> = {
  plant: "#a3e635",
  animal: "#fb923c",
  initiative: "#2dd4bf",
  equipment: "#a78bfa",
};

interface Props {
  projectId: string;
  section: Section;
  projectColor: ProjectColor;
}

export default function SectionCard({ projectId, section, projectColor }: Props) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function deleteSection() {
    dispatch({ type: "DELETE_SECTION", projectId, sectionId: section.id });
  }

  return (
    <div className="border border-border rounded overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-raised transition-colors group"
        onClick={() => setExpanded((v) => !v)}
        style={{ backgroundColor: expanded ? "#1a1a1a" : undefined }}
      >
        <ChevronRight
          size={13}
          className="text-muted-foreground flex-shrink-0 transition-transform duration-150"
          style={{ transform: expanded ? "rotate(90deg)" : undefined }}
        />

        {/* Type badge */}
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm uppercase tracking-wide flex-shrink-0"
          style={{
            color: TYPE_COLORS[section.type],
            backgroundColor: TYPE_COLORS[section.type] + "22",
          }}
        >
          {TYPE_LABELS[section.type]}
        </span>

        <span className="flex-1 text-[13px] text-foreground font-medium truncate">
          {section.name}
        </span>

        <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
          {section.items.length}
        </span>

        {/* Delete */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmDelete ? (
            <span className="flex items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">Remove?</span>
              <button
                onClick={deleteSection}
                className="text-destructive hover:opacity-80 font-medium"
              >
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
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border bg-panel">
          {/* Column headers */}
          {section.items.length > 0 && (
            <div className="grid grid-cols-[1fr_1fr_3rem_7rem_6rem] gap-2 px-3 py-1.5 border-b border-border">
              {["Name", "Variety", "Qty", "Date", "Status"].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {h}
                </span>
              ))}
            </div>
          )}

          {/* Items */}
          {section.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              projectId={projectId}
              sectionId={section.id}
              sectionType={section.type}
            />
          ))}

          {section.items.length === 0 && !addingItem && (
            <p className="text-[12px] text-muted-foreground px-3 py-2">
              No items yet.
            </p>
          )}

          {/* Add item */}
          <div className="px-3 py-2">
            {addingItem ? (
              <AddItemForm
                projectId={projectId}
                sectionId={section.id}
                sectionType={section.type}
                onDone={() => setAddingItem(false)}
              />
            ) : (
              <button
                onClick={() => setAddingItem(true)}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus size={12} />
                Add item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
