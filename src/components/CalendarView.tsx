"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAppState, useAppDispatch, useCurrentUser } from "@/lib/context";
import { getProjectColor } from "@/lib/colors";
import {
  getMonthGrid,
  gridDateStr,
  todayStr,
  toDateStr,
  parseDate,
  formatDateLong,
  getAllEventsForDate,
  countEventsOnDate,
  isEventDoneOnDate,
  MONTHS,
  MONTHS_SHORT,
  DAYS_SHORT,
} from "@/lib/calendar";
import { RECURRENCE_META, PRIORITY_META } from "@/lib/types";
import AddEventForm from "@/components/AddEventForm";

type ViewMode = "month" | "week" | "3day";

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#a3e635",
};

export default function CalendarView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const currentUser = useCurrentUser();
  const today = todayStr();
  const todayDate = parseDate(today);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  // Month view navigation
  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  // Shared selected/anchor date
  const [selectedDate, setSelectedDate] = useState(today);
  const [hiddenProjectIds, setHiddenProjectIds] = useState<Set<string>>(new Set());
  const [addingEvent, setAddingEvent] = useState(false);

  const projects = state.data.projects;
  const visibleProjectIds = new Set(
    projects.filter((p) => !hiddenProjectIds.has(p.id)).map((p) => p.id)
  );

  // --- Navigation ---
  function goToday() {
    setSelectedDate(today);
    setYear(todayDate.getFullYear());
    setMonth(todayDate.getMonth());
  }

  function prevPeriod() {
    if (viewMode === "month") {
      if (month === 0) { setYear((y) => y - 1); setMonth(11); }
      else setMonth((m) => m - 1);
    } else {
      shiftDate(viewMode === "week" ? -7 : -3);
    }
  }

  function nextPeriod() {
    if (viewMode === "month") {
      if (month === 11) { setYear((y) => y + 1); setMonth(0); }
      else setMonth((m) => m + 1);
    } else {
      shiftDate(viewMode === "week" ? 7 : 3);
    }
  }

  function shiftDate(days: number) {
    const d = parseDate(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(toDateStr(d));
  }

  function toggleProject(id: string) {
    setHiddenProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleEventDone(projectId: string, eventId: string, dateStr: string) {
    dispatch({ type: "TOGGLE_EVENT_DONE", projectId, eventId, dateStr, userId: currentUser?.id ?? "" });
  }

  // --- Period label ---
  function getPeriodLabel(): string {
    if (viewMode === "month") return `${MONTHS[month]} ${year}`;
    const dates = getViewDates();
    return formatRange(dates[0], dates[dates.length - 1]);
  }

  // --- View dates (week / 3-day) ---
  function getViewDates(): string[] {
    if (viewMode === "week") {
      const d = parseDate(selectedDate);
      d.setDate(d.getDate() - d.getDay()); // back to Sunday
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(d);
        day.setDate(d.getDate() + i);
        return toDateStr(day);
      });
    } else {
      // 3-day: selectedDate ± 1
      const d = parseDate(selectedDate);
      d.setDate(d.getDate() - 1);
      return Array.from({ length: 3 }, (_, i) => {
        const day = new Date(d);
        day.setDate(d.getDate() + i);
        return toDateStr(day);
      });
    }
  }

  // --- Month grid cells ---
  const grid = getMonthGrid(year, month);
  const monthCells: (string | null)[] = [];
  for (let i = 0; i < grid.firstDayOfWeek; i++) monthCells.push(null);
  for (let d = 1; d <= grid.daysInMonth; d++) monthCells.push(gridDateStr(year, month, d));
  while (monthCells.length % 7 !== 0) monthCells.push(null);

  // --- Day detail (month view) ---
  const dayEvents = getAllEventsForDate(projects, selectedDate, visibleProjectIds);
  const eventsByProject = projects
    .map((p) => ({ project: p, events: dayEvents.filter((e) => e.projectId === p.id) }))
    .filter((g) => g.events.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-4 md:px-6 py-4 border-b border-border flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[22px] font-semibold text-foreground">Calendar</h1>

          {/* View mode toggle */}
          <div className="flex items-center bg-surface border border-border rounded overflow-hidden ml-2">
            {(["month", "week", "3day"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="text-[11px] px-2.5 py-1.5 transition-colors font-medium"
                style={
                  viewMode === mode
                    ? { backgroundColor: "#1a1a1a", color: "#fafafa" }
                    : { color: "#888888" }
                }
              >
                {mode === "month" ? "Month" : mode === "week" ? "Week" : "3-day"}
              </button>
            ))}
          </div>

          {/* Nav */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={prevPeriod}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[13px] font-semibold text-foreground min-w-[140px] text-center tabular-nums">
              {getPeriodLabel()}
            </span>
            <button
              onClick={nextPeriod}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={goToday}
            className="text-[11px] text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Project pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {projects.map((p) => {
            const pc = getProjectColor(p.color);
            const hidden = hiddenProjectIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProject(p.id)}
                className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border transition-colors"
                style={
                  hidden
                    ? { borderColor: "#333", color: "#555", backgroundColor: "transparent" }
                    : { borderColor: pc.hex + "66", color: pc.hex, backgroundColor: pc.bg }
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: hidden ? "#555" : pc.hex }}
                />
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "month" && (
          <MonthView
            monthCells={monthCells}
            today={today}
            selectedDate={selectedDate}
            projects={projects}
            visibleProjectIds={visibleProjectIds}
            onSelectDate={(d) => { setSelectedDate(d); setAddingEvent(false); }}
            eventsByProject={eventsByProject}
            addingEvent={addingEvent}
            onAddEvent={() => setAddingEvent(true)}
            onAddEventDone={() => setAddingEvent(false)}
            onToggleDone={toggleEventDone}
          />
        )}

        {(viewMode === "week" || viewMode === "3day") && (
          <ColumnView
            dates={getViewDates()}
            today={today}
            selectedDate={selectedDate}
            projects={projects}
            visibleProjectIds={visibleProjectIds}
            onSelectDate={setSelectedDate}
            onToggleDone={toggleEventDone}
            compact={viewMode === "week"}
          />
        )}
      </div>
    </div>
  );
}

// ─── Month view ───────────────────────────────────────────────────────────────

function MonthView({
  monthCells,
  today,
  selectedDate,
  projects,
  visibleProjectIds,
  onSelectDate,
  eventsByProject,
  addingEvent,
  onAddEvent,
  onAddEventDone,
  onToggleDone,
}: {
  monthCells: (string | null)[];
  today: string;
  selectedDate: string;
  projects: { id: string; color: string; events: import("@/lib/types").Event[] }[];
  visibleProjectIds: Set<string>;
  onSelectDate: (d: string) => void;
  eventsByProject: { project: { id: string; name: string; icon: string; color: string }; events: import("@/lib/calendar").EventInstanceWithProject[] }[];
  addingEvent: boolean;
  onAddEvent: () => void;
  onAddEventDone: () => void;
  onToggleDone: (projectId: string, eventId: string, dateStr: string) => void;
}) {
  return (
    <>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border px-2">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-b border-border">
        {monthCells.map((dateStr, i) => {
          if (!dateStr) {
            return <div key={`e-${i}`} className="border-r border-b border-border min-h-[72px] last:border-r-0 bg-surface/30" />;
          }
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const dotMap = countEventsOnDate(projects, dateStr, visibleProjectIds);
          const dots = Array.from(dotMap.entries());
          const visibleDots = dots.slice(0, 4);
          const extraCount = Math.max(0, dots.length - 4);
          const dayNum = parseInt(dateStr.split("-")[2]);

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className="border-r border-b border-border min-h-[72px] last:border-r-0 p-1.5 cursor-pointer hover:bg-raised transition-colors flex flex-col"
              style={isSelected ? { backgroundColor: "#1a1a1a" } : undefined}
            >
              <div className="flex items-center justify-end mb-1">
                <span
                  className="text-[12px] font-mono tabular-nums w-6 h-6 flex items-center justify-center rounded-full"
                  style={
                    isToday
                      ? { backgroundColor: "#a3e635", color: "#0a0a0a", fontWeight: 700 }
                      : { color: isSelected ? "#fafafa" : "#888888" }
                  }
                >
                  {dayNum}
                </span>
              </div>
              {dots.length > 0 && (
                <div className="flex items-center gap-0.5 flex-wrap mt-auto">
                  {visibleDots.map(([color], idx) => (
                    <span key={idx} className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  ))}
                  {extraCount > 0 && <span className="text-[9px] text-muted-foreground font-mono">+{extraCount}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day detail panel */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-foreground">{formatDateLong(selectedDate)}</h2>
          {!addingEvent && (
            <button onClick={onAddEvent} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
              <Plus size={12} /> Add event
            </button>
          )}
        </div>

        {addingEvent && (
          <div className="mb-4">
            <AddEventForm projectId="" defaultDate={selectedDate} onDone={onAddEventDone} />
          </div>
        )}

        {eventsByProject.length === 0 && !addingEvent && (
          <p className="text-[12px] text-muted-foreground">No events on this day.</p>
        )}

        <div className="flex flex-col gap-4">
          {eventsByProject.map(({ project, events }) => {
            const pc = getProjectColor(project.color);
            return (
              <div key={project.id}>
                <div className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 pb-1 border-b" style={{ color: pc.hex, borderColor: pc.border }}>
                  {project.icon} {project.name}
                </div>
                <div className="flex flex-col">
                  {events.map(({ event }) => {
                    const done = isEventDoneOnDate(event, selectedDate);
                    return (
                      <div key={event.id} className="flex items-center gap-2 py-[5px] border-l-2 pl-3 hover:bg-raised transition-colors" style={{ borderColor: pc.hex }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLORS[event.priority] }} />
                        <input type="checkbox" checked={done} onChange={() => onToggleDone(project.id, event.id, selectedDate)} className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer accent-primary" />
                        <span className={`flex-1 text-[13px] ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{event.title}</span>
                        {event.recurrence !== "none" && (
                          <span className="text-[10px] text-muted-foreground bg-surface px-1.5 py-0.5 rounded-sm font-mono flex-shrink-0">
                            {RECURRENCE_META[event.recurrence].label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Column view (week / 3-day) ───────────────────────────────────────────────

function ColumnView({
  dates,
  today,
  selectedDate,
  projects,
  visibleProjectIds,
  onSelectDate,
  onToggleDone,
  compact,
}: {
  dates: string[];
  today: string;
  selectedDate: string;
  projects: { id: string; name: string; icon: string; color: string; events: import("@/lib/types").Event[] }[];
  visibleProjectIds: Set<string>;
  onSelectDate: (d: string) => void;
  onToggleDone: (projectId: string, eventId: string, dateStr: string) => void;
  compact: boolean; // true = week (tight), false = 3-day (spacious)
}) {
  return (
    <div className={`grid border-b border-border h-full`} style={{ gridTemplateColumns: `repeat(${dates.length}, 1fr)` }}>
      {dates.map((dateStr) => {
        const isToday = dateStr === today;
        const isSelected = dateStr === selectedDate;
        const dayNum = parseInt(dateStr.split("-")[2]);
        const dayName = DAYS_SHORT[parseDate(dateStr).getDay()];
        const colEvents = getAllEventsForDate(projects, dateStr, visibleProjectIds);

        return (
          <div
            key={dateStr}
            className="border-r border-border last:border-r-0 flex flex-col min-h-[300px]"
            style={isSelected ? { backgroundColor: "#111111" } : undefined}
          >
            {/* Day header */}
            <div
              className="px-2 py-2 border-b border-border cursor-pointer hover:bg-raised transition-colors flex-shrink-0"
              onClick={() => onSelectDate(dateStr)}
            >
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{dayName}</div>
              <div
                className="text-[20px] font-semibold tabular-nums leading-tight mt-0.5 w-8 h-8 flex items-center justify-center rounded-full"
                style={
                  isToday
                    ? { backgroundColor: "#a3e635", color: "#0a0a0a" }
                    : { color: isSelected ? "#fafafa" : "#fafafa" }
                }
              >
                {dayNum}
              </div>
            </div>

            {/* Events */}
            <div className="flex flex-col gap-0.5 p-1.5 flex-1 overflow-y-auto">
              {colEvents.length === 0 && (
                <span className="text-[11px] text-muted-foreground px-1 pt-1">—</span>
              )}
              {colEvents.map(({ event, done, projectId }) => {
                const project = projects.find((p) => p.id === projectId);
                if (!project) return null;
                const pc = getProjectColor(project.color);
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-raised transition-colors border-l-2 cursor-default"
                    style={{ borderColor: pc.hex, backgroundColor: done ? "transparent" : pc.bg }}
                  >
                    <span
                      className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PRIORITY_COLORS[event.priority] }}
                    />
                    <span
                      className={`flex-1 truncate ${compact ? "text-[11px]" : "text-[12px]"} ${done ? "line-through opacity-40" : "text-foreground"}`}
                    >
                      {event.title}
                    </span>
                    {!compact && event.recurrence !== "none" && (
                      <span className="text-[9px] text-muted-foreground font-mono flex-shrink-0">
                        {RECURRENCE_META[event.recurrence].label}
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => onToggleDone(projectId, event.id, dateStr)}
                      className="w-3 h-3 flex-shrink-0 cursor-pointer accent-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRange(start: string, end: string): string {
  const s = parseDate(start);
  const e = parseDate(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()} – ${MONTHS_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}
