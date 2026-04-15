"use client";

import { useState, useMemo } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import yaml from "js-yaml";
import { useAppDispatch, newId } from "@/lib/context";
import type { Event, Section, Item, Recurrence, Priority, SectionType, ItemStatus } from "@/lib/types";
import { todayStr } from "@/lib/calendar";

interface ImportedEvent {
  title: string;
  date: string;
  recurrence?: Recurrence;
  priority?: Priority;
  notes?: string;
  assignees?: string[];
}

interface ImportedItem {
  name: string;
  variety?: string;
  qty?: number;
  notes?: string;
}

interface ImportedSection {
  name: string;
  type: SectionType;
  items?: ImportedItem[];
}

interface ImportPayload {
  events?: ImportedEvent[];
  sections?: ImportedSection[];
  notes?: string;
}

interface ParseResult {
  payload: ImportPayload;
  bodyNotes: string;
  error: null;
}

interface ParseError {
  payload: null;
  bodyNotes: null;
  error: string;
}

const VALID_RECURRENCES = new Set<string>(["none", "daily", "weekly", "biweekly", "monthly", "seasonal"]);
const VALID_PRIORITIES  = new Set<string>(["high", "medium", "low"]);
const VALID_TYPES       = new Set<string>(["plant", "animal", "initiative", "equipment"]);

function parseInput(raw: string): ParseResult | ParseError {
  const trimmed = raw.trim();
  if (!trimmed) return { payload: {}, bodyNotes: "", error: null };

  let yamlStr = trimmed;
  let bodyNotes = "";

  // Markdown frontmatter: starts with ---
  if (trimmed.startsWith("---")) {
    const end = trimmed.indexOf("\n---", 3);
    if (end === -1) {
      // Try closing --- at end
      const endAlt = trimmed.lastIndexOf("\n---");
      if (endAlt > 3) {
        yamlStr  = trimmed.slice(3, endAlt).trim();
        bodyNotes = "";
      } else {
        yamlStr  = trimmed.slice(3).trim();
        bodyNotes = "";
      }
    } else {
      yamlStr   = trimmed.slice(3, end).trim();
      bodyNotes = trimmed.slice(end + 4).trim();
      // Strip leading markdown heading for use as notes
      bodyNotes = bodyNotes.replace(/^#+\s+[^\n]*\n?/, "").trim();
    }
  }

  try {
    const parsed = yaml.load(yamlStr) as ImportPayload | null;
    if (!parsed || typeof parsed !== "object") {
      return { error: "Could not parse as YAML — check your syntax.", payload: null, bodyNotes: null };
    }
    return { payload: parsed, bodyNotes, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `YAML parse error: ${msg}`, payload: null, bodyNotes: null };
  }
}

interface PreviewStats {
  events: number;
  sections: number;
  items: number;
  hasNotes: boolean;
  warnings: string[];
}

function getPreviewStats(payload: ImportPayload, bodyNotes: string): PreviewStats {
  const warnings: string[] = [];
  let events = 0, sections = 0, items = 0;

  for (const ev of payload.events ?? []) {
    if (!ev.title) { warnings.push("An event is missing a title"); continue; }
    if (!ev.date)  { warnings.push(`Event "${ev.title}" has no date`); continue; }
    if (ev.recurrence && !VALID_RECURRENCES.has(ev.recurrence)) {
      warnings.push(`Event "${ev.title}" has invalid recurrence "${ev.recurrence}" — defaulting to none`);
    }
    if (ev.priority && !VALID_PRIORITIES.has(ev.priority)) {
      warnings.push(`Event "${ev.title}" has invalid priority "${ev.priority}" — defaulting to medium`);
    }
    events++;
  }

  for (const sec of payload.sections ?? []) {
    if (!sec.name) { warnings.push("A section is missing a name"); continue; }
    if (!sec.type || !VALID_TYPES.has(sec.type)) {
      warnings.push(`Section "${sec.name}" has invalid type "${sec.type}" — defaulting to "initiative"`);
    }
    sections++;
    items += (sec.items ?? []).filter((i) => i.name).length;
  }

  const hasNotes = !!(payload.notes || bodyNotes);
  return { events, sections, items, hasNotes, warnings };
}

interface Props {
  projectId: string;
  onDone: () => void;
}

export default function ImportPanel({ projectId, onDone }: Props) {
  const dispatch = useAppDispatch();
  const [input,   setInput]   = useState("");
  const [applied, setApplied] = useState(false);

  const parsed = useMemo(() => parseInput(input), [input]);
  const stats  = useMemo(
    () => (parsed.error === null && parsed.payload ? getPreviewStats(parsed.payload, parsed.bodyNotes) : null),
    [parsed]
  );

  const today = todayStr();
  const hasAnything = stats && (stats.events + stats.sections > 0 || stats.hasNotes);

  function applyImport() {
    if (parsed.error !== null || !parsed.payload) return;
    const { payload, bodyNotes } = parsed;

    // Events
    for (const ev of payload.events ?? []) {
      if (!ev.title || !ev.date) continue;
      const event: Event = {
        id:            newId("evt"),
        title:         ev.title,
        date:          ev.date,
        recurrence:    VALID_RECURRENCES.has(ev.recurrence ?? "") ? (ev.recurrence as Recurrence) : "none",
        priority:      VALID_PRIORITIES.has(ev.priority ?? "")    ? (ev.priority as Priority)     : "medium",
        notes:         ev.notes ?? "",
        assignees:     ev.assignees ?? [],
        projectId,
        completionLog: [],
        intents:       [],
      };
      dispatch({ type: "ADD_EVENT", projectId, event });
    }

    // Sections + items
    for (const sec of payload.sections ?? []) {
      if (!sec.name) continue;
      const sectionItems: Item[] = (sec.items ?? [])
        .filter((i) => i.name)
        .map((i) => ({
          id:      newId("item"),
          name:    i.name,
          variety: i.variety ?? "",
          qty:     typeof i.qty === "number" && i.qty > 0 ? Math.round(i.qty) : 1,
          date:    today,
          notes:   i.notes ?? "",
          status:  "planned" as ItemStatus,
        }));

      const section: Section = {
        id:      newId("sec"),
        name:    sec.name,
        type:    VALID_TYPES.has(sec.type) ? (sec.type as SectionType) : "initiative",
        details: {},
        items:   sectionItems,
      };
      dispatch({ type: "ADD_SECTION", projectId, section });
    }

    // Notes (body takes priority; then explicit notes field)
    const notesValue = bodyNotes || payload.notes;
    if (notesValue) {
      dispatch({ type: "UPDATE_PROJECT", projectId, updates: { notes: notesValue } });
    }

    setApplied(true);
    setTimeout(onDone, 900);
  }

  if (applied) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-panel border border-border rounded text-[13px] text-foreground">
        <CheckCircle size={14} className="text-primary flex-shrink-0" />
        Import applied successfully.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 bg-panel border border-border-emphasized rounded p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold tracking-widest uppercase text-muted-foreground">Import</span>
        <button onClick={onDone} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
          <X size={13} />
        </button>
      </div>

      {/* Instructions */}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Paste YAML or a Markdown file with YAML frontmatter. Supported keys:{" "}
        <span className="font-mono text-foreground/70">events</span>,{" "}
        <span className="font-mono text-foreground/70">sections</span>,{" "}
        <span className="font-mono text-foreground/70">notes</span>.
      </p>

      {/* Textarea */}
      <textarea
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`---\nevents:\n  - title: Spring pruning\n    date: 2026-04-20\n    recurrence: none\n    priority: high\nsections:\n  - name: High Bush\n    type: plant\n    items:\n      - name: Duke\n        qty: 6\n---\nOptional notes as markdown body.`}
        rows={12}
        className="w-full bg-surface border border-border rounded px-3 py-2 text-[12px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring resize-y"
        spellCheck={false}
      />

      {/* Parse error */}
      {parsed.error && (
        <div className="flex items-start gap-2 text-[12px] text-destructive bg-destructive/10 rounded px-3 py-2">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          {parsed.error}
        </div>
      )}

      {/* Preview */}
      {stats && input.trim() && (
        <div className="flex flex-col gap-1.5 border border-border rounded px-3 py-2.5 bg-raised">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Preview</span>

          <div className="flex flex-wrap gap-3">
            {stats.events > 0 && (
              <span className="text-[12px] text-foreground">
                <span className="font-mono font-semibold text-primary">{stats.events}</span>{" "}
                {stats.events === 1 ? "event" : "events"}
              </span>
            )}
            {stats.sections > 0 && (
              <span className="text-[12px] text-foreground">
                <span className="font-mono font-semibold text-primary">{stats.sections}</span>{" "}
                {stats.sections === 1 ? "section" : "sections"}
                {stats.items > 0 && (
                  <span className="text-muted-foreground"> ({stats.items} items)</span>
                )}
              </span>
            )}
            {stats.hasNotes && (
              <span className="text-[12px] text-foreground">
                <span className="font-mono font-semibold text-primary">notes</span> update
              </span>
            )}
            {!hasAnything && (
              <span className="text-[12px] text-muted-foreground italic">Nothing to import</span>
            )}
          </div>

          {stats.warnings.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {stats.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-warning">
                  <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={applyImport}
          disabled={!hasAnything}
          className="text-[12px] px-3 py-1.5 bg-primary text-primary-foreground rounded font-medium hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          Apply import
        </button>
        <button
          onClick={onDone}
          className="text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
