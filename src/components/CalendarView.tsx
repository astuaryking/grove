"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useAppState, useAppDispatch } from "@/lib/context";
import { getProjectColor } from "@/lib/colors";
import {
  getMonthGrid,
  gridDateStr,
  todayStr,
  formatDateLong,
  getAllEventsForDate,
  countEventsOnDate,
  isEventDoneOnDate,
  MONTHS,
  DAYS_SHORT,
} from "@/lib/calendar";
import { RECURRENCE_META, PRIORITY_META } from "@/lib/types";
import AddEventForm from "@/components/AddEventForm";

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#a3e635",
};

export default function CalendarView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const today = todayStr();
  const todayDate = new Date(today + "T12:00:00");

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [hiddenProjectIds, setHiddenProjectIds] = useState<Set<string>>(new Set());
  const [addingEvent, setAddingEvent] = useState(false);

  const projects = state.data.projects;
  const visibleProjectIds = new Set(
    projects.filter((p) => !hiddenProjectIds.has(p.id)).map((p) => p.id)
  );

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  function toggleProject(id: string) {
    setHiddenProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleEventDone(projectId: string, eventId: string) {
    dispatch({ type: "TOGGLE_EVENT_DONE", projectId, eventId, dateStr: selectedDate });
  }

  // Build grid cells: null = empty padding, string = date
  const grid = getMonthGrid(year, month);
  const cells: (string | null)[] = [];
  for (let i = 0; i < grid.firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= grid.daysInMonth; d++) cells.push(gridDateStr(year, month, d));
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  // Selected day events (grouped by project)
  const dayEvents = getAllEventsForDate(projects, selectedDate, visibleProjectIds);
  const eventsByProject = projects
    .map((p) => ({
      project: p,
      events: dayEvents.filter((e) => e.projectId === p.id),
    }))
    .filter((g) => g.events.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-border flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-[22px] font-semibold text-foreground">Calendar</h1>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={prevMonth}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[15px] font-semibold text-foreground w-40 text-center tabular-nums">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-raised transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => { setYear(todayDate.getFullYear()); setMonth(todayDate.getMonth()); setSelectedDate(today); }}
            className="text-[12px] text-muted-foreground hover:text-foreground border border-border rounded px-2 py-0.5 transition-colors ml-1"
          >
            Today
          </button>
        </div>

        {/* Project toggle pills */}
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
                    ? { borderColor: "#333333", color: "#555555", backgroundColor: "transparent" }
                    : { borderColor: pc.hex + "66", color: pc.hex, backgroundColor: pc.bg }
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: hidden ? "#555555" : pc.hex }}
                />
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-border px-2">
          {DAYS_SHORT.map((d) => (
            <div
              key={d}
              className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 border-b border-border">
          {cells.map((dateStr, i) => {
            if (!dateStr) {
              return <div key={`empty-${i}`} className="border-r border-b border-border min-h-[72px] last:border-r-0 bg-surface/30" />;
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
                onClick={() => { setSelectedDate(dateStr); setAddingEvent(false); }}
                className="border-r border-b border-border min-h-[72px] last:border-r-0 p-1.5 cursor-pointer hover:bg-raised transition-colors flex flex-col"
                style={
                  isSelected
                    ? { backgroundColor: "#1a1a1a" }
                    : undefined
                }
              >
                {/* Day number */}
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

                {/* Event dots */}
                {dots.length > 0 && (
                  <div className="flex items-center gap-0.5 flex-wrap mt-auto">
                    {visibleDots.map(([color], idx) => (
                      <span
                        key={idx}
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    {extraCount > 0 && (
                      <span className="text-[9px] text-muted-foreground font-mono">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Day detail panel */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-foreground">
              {formatDateLong(selectedDate)}
            </h2>
            {!addingEvent && (
              <button
                onClick={() => setAddingEvent(true)}
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus size={12} />
                Add event
              </button>
            )}
          </div>

          {addingEvent && (
            <div className="mb-4">
              <AddEventForm
                projectId={projects[0]?.id ?? ""}
                defaultDate={selectedDate}
                onDone={() => setAddingEvent(false)}
              />
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
                  {/* Project header */}
                  <div
                    className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 pb-1 border-b"
                    style={{ color: pc.hex, borderColor: pc.border }}
                  >
                    {project.icon} {project.name}
                  </div>

                  {/* Events */}
                  <div className="flex flex-col">
                    {events.map(({ event }) => {
                      const done = isEventDoneOnDate(event, selectedDate);
                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-2 py-[5px] border-l-2 pl-3 hover:bg-raised transition-colors"
                          style={{ borderColor: pc.hex }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PRIORITY_COLORS[event.priority] }}
                            title={PRIORITY_META[event.priority].label}
                          />
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => toggleEventDone(project.id, event.id)}
                            className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer accent-primary"
                          />
                          <span
                            className={`flex-1 text-[13px] ${done ? "line-through text-muted-foreground" : "text-foreground"}`}
                          >
                            {event.title}
                          </span>
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
      </div>
    </div>
  );
}
