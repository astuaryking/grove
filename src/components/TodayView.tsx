"use client";

import { useAppState, useAppDispatch } from "@/lib/context";
import { getProjectColor } from "@/lib/colors";
import {
  todayStr,
  formatDateLong,
  getAllEventsForDate,
  getOverdueEvents,
  isEventDoneOnDate,
} from "@/lib/calendar";
import { RECURRENCE_META, PRIORITY_META } from "@/lib/types";
import type { EventInstanceWithProject } from "@/lib/calendar";

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#a3e635",
};

export default function TodayView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const today = todayStr();
  const projects = state.data.projects;

  const allProjectIds = new Set(projects.map((p) => p.id));
  const todayEvents = getAllEventsForDate(projects, today, allProjectIds);

  const totalCount = todayEvents.length;
  const doneCount = todayEvents.filter((e) => e.done).length;

  const overdueEvents = projects.flatMap((p) =>
    getOverdueEvents(p.events, today).map((ev) => ({ event: ev, project: p }))
  );

  const highPriorityEvents = todayEvents.filter(
    (e) => e.event.priority === "high"
  );

  const eventsByProject = projects
    .map((p) => ({
      project: p,
      events: todayEvents.filter((e) => e.projectId === p.id),
    }))
    .filter((g) => g.events.length > 0);

  function toggleDone(projectId: string, eventId: string) {
    dispatch({ type: "TOGGLE_EVENT_DONE", projectId, eventId, dateStr: today });
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-[22px] font-semibold text-foreground">
          {formatDateLong(today)}
        </h1>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-6 max-w-2xl">
        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Tasks" value={totalCount} />
          <MetricCard label="Done" value={doneCount} accent="#a3e635" />
          <MetricCard
            label="Overdue"
            value={overdueEvents.length}
            accent={overdueEvents.length > 0 ? "#ef4444" : undefined}
          />
        </div>

        {/* Overdue */}
        {overdueEvents.length > 0 && (
          <section>
            <SectionHeader label="Overdue" color="#ef4444" />
            <div className="flex flex-col">
              {overdueEvents.map(({ event, project }) => {
                const pc = getProjectColor(project.color);
                const done = isEventDoneOnDate(event, event.date);
                return (
                  <TodayEventRow
                    key={event.id}
                    title={event.title}
                    priority={event.priority}
                    recurrence={event.recurrence}
                    done={done}
                    projectName={project.name}
                    projectColor={pc.hex}
                    onToggle={() => toggleDone(project.id, event.id)}
                    overdue
                    dateStr={event.date}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* High priority */}
        {highPriorityEvents.length > 0 && (
          <section>
            <SectionHeader label="High priority" color="#ef4444" />
            <div className="flex flex-col">
              {highPriorityEvents.map((instance) => {
                const project = projects.find(
                  (p) => p.id === instance.projectId
                );
                if (!project) return null;
                const pc = getProjectColor(project.color);
                return (
                  <TodayEventRow
                    key={instance.event.id}
                    title={instance.event.title}
                    priority={instance.event.priority}
                    recurrence={instance.event.recurrence}
                    done={instance.done}
                    projectName={project.name}
                    projectColor={pc.hex}
                    onToggle={() => toggleDone(project.id, instance.event.id)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* By project */}
        {eventsByProject.map(({ project, events }) => {
          const pc = getProjectColor(project.color);
          return (
            <section key={project.id}>
              <SectionHeader
                label={`${project.icon} ${project.name}`}
                color={pc.hex}
              />
              <div className="flex flex-col">
                {events.map((instance) => (
                  <TodayEventRow
                    key={instance.event.id}
                    title={instance.event.title}
                    priority={instance.event.priority}
                    recurrence={instance.event.recurrence}
                    done={instance.done}
                    onToggle={() => toggleDone(project.id, instance.event.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {totalCount === 0 && overdueEvents.length === 0 && (
          <p className="text-[13px] text-muted-foreground">
            Nothing scheduled for today.
          </p>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="bg-panel border border-border rounded p-3">
      <div
        className="text-[22px] font-semibold font-mono tabular-nums leading-none"
        style={{ color: accent ?? "#fafafa" }}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wide font-medium">
        {label}
      </div>
    </div>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 pb-1 border-b"
      style={{ color, borderColor: color + "44" }}
    >
      {label}
    </div>
  );
}

function TodayEventRow({
  title,
  priority,
  recurrence,
  done,
  projectName,
  projectColor,
  onToggle,
  overdue,
  dateStr,
}: {
  title: string;
  priority: string;
  recurrence: string;
  done: boolean;
  projectName?: string;
  projectColor?: string;
  onToggle: () => void;
  overdue?: boolean;
  dateStr?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 py-[5px] border-b border-border last:border-b-0 hover:bg-raised transition-colors ${
        done ? "opacity-50" : ""
      }`}
    >
      {/* Priority dot */}
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: PRIORITY_COLORS[priority] ?? "#555" }}
        title={PRIORITY_META[priority as keyof typeof PRIORITY_META]?.label}
      />

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={done}
        onChange={onToggle}
        className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer accent-primary"
      />

      {/* Title */}
      <span
        className={`flex-1 text-[13px] min-w-0 truncate ${
          done ? "line-through text-muted-foreground" : "text-foreground"
        }`}
      >
        {title}
      </span>

      {/* Overdue date */}
      {overdue && dateStr && (
        <span className="text-[11px] font-mono text-destructive tabular-nums flex-shrink-0">
          {formatShort(dateStr)}
        </span>
      )}

      {/* Project tag (for high priority / overdue sections) */}
      {projectName && projectColor && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium flex-shrink-0"
          style={{
            color: projectColor,
            backgroundColor: projectColor + "22",
          }}
        >
          {projectName}
        </span>
      )}

      {/* Recurrence badge */}
      {recurrence !== "none" && (
        <span className="text-[10px] text-muted-foreground bg-surface px-1.5 py-0.5 rounded-sm font-mono flex-shrink-0">
          {RECURRENCE_META[recurrence as keyof typeof RECURRENCE_META]?.label}
        </span>
      )}
    </div>
  );
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
