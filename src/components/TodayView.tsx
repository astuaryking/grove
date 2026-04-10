"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { useAppState, useAppDispatch, useCurrentUser } from "@/lib/context";
import { getProjectColor } from "@/lib/colors";
import {
  todayStr,
  formatDateLong,
  getAllEventsForDate,
  getOverdueEvents,
  isEventDoneByUser,
  getCompletionsForDate,
  getIntentForUser,
} from "@/lib/calendar";
import { RECURRENCE_META, PRIORITY_META } from "@/lib/types";
import type { User, Event } from "@/lib/types";

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#a3e635",
};

export default function TodayView() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const currentUser = useCurrentUser();
  const today = todayStr();
  const projects = state.data.projects;
  const users = state.data.users;

  const allProjectIds = new Set(projects.map((p) => p.id));
  const todayEvents = getAllEventsForDate(projects, today, allProjectIds);

  const totalCount = todayEvents.length;
  const doneCount = todayEvents.filter((e) =>
    getCompletionsForDate(e.event, today).length > 0
  ).length;

  const overdueEvents = projects.flatMap((p) =>
    getOverdueEvents(p.events, today).map((ev) => ({ event: ev, project: p }))
  );

  // Partition: assigned to a specific user, or unassigned
  function eventsForUser(userId: string) {
    return todayEvents.filter((e) => e.event.assignees?.includes(userId));
  }
  const unassignedEvents = todayEvents.filter(
    (e) => !e.event.assignees?.length
  );

  function toggleDone(projectId: string, eventId: string) {
    if (!currentUser) return;
    dispatch({ type: "TOGGLE_EVENT_DONE", projectId, eventId, dateStr: today, userId: currentUser.id });
  }

  function setIntent(projectId: string, eventId: string, note: string) {
    if (!currentUser) return;
    dispatch({ type: "SET_INTENT", projectId, eventId, dateStr: today, userId: currentUser.id, note });
  }

  function clearIntent(projectId: string, eventId: string) {
    if (!currentUser) return;
    dispatch({ type: "CLEAR_INTENT", projectId, eventId, dateStr: today, userId: currentUser.id });
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground">{formatDateLong(today)}</h1>
        </div>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-6 max-w-2xl">
        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Tasks" value={totalCount} />
          <MetricCard label="Done" value={doneCount} accent="#a3e635" />
          <MetricCard label="Overdue" value={overdueEvents.length} accent={overdueEvents.length > 0 ? "#ef4444" : undefined} />
        </div>

        {/* Overdue */}
        {overdueEvents.length > 0 && (
          <section>
            <SectionHeader label="Overdue" color="#ef4444" />
            <div className="flex flex-col">
              {overdueEvents.map(({ event, project }) => {
                const pc = getProjectColor(project.color);
                const completions = getCompletionsForDate(event, event.date);
                return (
                  <TodayEventRow
                    key={event.id}
                    event={event}
                    today={today}
                    users={users}
                    currentUser={currentUser}
                    completions={completions}
                    projectName={project.name}
                    projectColor={pc.hex}
                    showProjectTag
                    overdue
                    onToggle={() => toggleDone(project.id, event.id)}
                    onSetIntent={(note) => setIntent(project.id, event.id, note)}
                    onClearIntent={() => clearIntent(project.id, event.id)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Per-user sections */}
        {users.map((user) => {
          const userEvents = eventsForUser(user.id);
          if (userEvents.length === 0) return null;
          const isMe = user.id === currentUser?.id;
          return (
            <section key={user.id}>
              <SectionHeader
                label={isMe ? `My tasks — ${user.name}` : `${user.name}'s tasks`}
                color={user.color}
              />
              <div className="flex flex-col">
                {userEvents.map(({ event, projectId }) => {
                  const project = projects.find((p) => p.id === projectId);
                  if (!project) return null;
                  const pc = getProjectColor(project.color);
                  const completions = getCompletionsForDate(event, today);
                  const intent = getIntentForUser(event, today, user.id);
                  return (
                    <TodayEventRow
                      key={event.id}
                      event={event}
                      today={today}
                      users={users}
                      currentUser={currentUser}
                      completions={completions}
                      intent={intent}
                      projectName={project.name}
                      projectColor={pc.hex}
                      showProjectTag
                      onToggle={() => toggleDone(project.id, event.id)}
                      onSetIntent={(note) => setIntent(project.id, event.id, note)}
                      onClearIntent={() => clearIntent(project.id, event.id)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Unassigned */}
        {unassignedEvents.length > 0 && (
          <section>
            <SectionHeader label="Unassigned" color="#555555" />
            <div className="flex flex-col">
              {unassignedEvents.map(({ event, projectId }) => {
                const project = projects.find((p) => p.id === projectId);
                if (!project) return null;
                const pc = getProjectColor(project.color);
                const completions = getCompletionsForDate(event, today);
                return (
                  <TodayEventRow
                    key={event.id}
                    event={event}
                    today={today}
                    users={users}
                    currentUser={currentUser}
                    completions={completions}
                    projectName={project.name}
                    projectColor={pc.hex}
                    showProjectTag
                    onToggle={() => toggleDone(project.id, event.id)}
                    onSetIntent={(note) => setIntent(project.id, event.id, note)}
                    onClearIntent={() => clearIntent(project.id, event.id)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {totalCount === 0 && overdueEvents.length === 0 && (
          <p className="text-[13px] text-muted-foreground">Nothing scheduled for today.</p>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-panel border border-border rounded p-3">
      <div className="text-[22px] font-semibold font-mono tabular-nums leading-none" style={{ color: accent ?? "#fafafa" }}>
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wide font-medium">{label}</div>
    </div>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 pb-1 border-b" style={{ color, borderColor: color + "44" }}>
      {label}
    </div>
  );
}

interface TodayEventRowProps {
  event: Event;
  today: string;
  users: User[];
  currentUser: User | null;
  completions: import("@/lib/types").Completion[];
  intent?: import("@/lib/types").Intent;
  projectName: string;
  projectColor: string;
  showProjectTag?: boolean;
  overdue?: boolean;
  onToggle: () => void;
  onSetIntent: (note: string) => void;
  onClearIntent: () => void;
}

function TodayEventRow({
  event,
  today,
  users,
  currentUser,
  completions,
  intent,
  projectName,
  projectColor,
  showProjectTag,
  overdue,
  onToggle,
  onSetIntent,
  onClearIntent,
}: TodayEventRowProps) {
  const [editingIntent, setEditingIntent] = useState(false);
  const [intentDraft, setIntentDraft] = useState("");

  // Done = completed by anyone
  const doneByAnyone = completions.length > 0;
  // Done by current user specifically
  const doneByMe = currentUser
    ? completions.some((c) => c.userId === currentUser.id)
    : false;

  const isCurrentUserAssigned = currentUser
    ? event.assignees?.includes(currentUser.id)
    : false;

  function submitIntent(e: React.FormEvent) {
    e.preventDefault();
    onSetIntent(intentDraft);
    setEditingIntent(false);
  }

  return (
    <div className={`flex flex-col border-b border-border last:border-b-0 ${doneByAnyone ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2 py-[5px] hover:bg-raised transition-colors group">
        {/* Priority dot */}
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: PRIORITY_COLORS[event.priority] ?? "#555" }}
          title={PRIORITY_META[event.priority as keyof typeof PRIORITY_META]?.label}
        />

        {/* Checkbox — toggles current user's completion */}
        <input
          type="checkbox"
          checked={doneByMe}
          onChange={onToggle}
          className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer accent-primary"
        />

        {/* Title */}
        <span className={`flex-1 text-[13px] min-w-0 truncate ${doneByAnyone ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {event.title}
        </span>

        {/* Assignee badges */}
        {event.assignees?.length > 0 && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {event.assignees.map((uid) => {
              const u = users.find((x) => x.id === uid);
              if (!u) return null;
              return (
                <span key={uid} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ color: u.color, backgroundColor: u.color + "22" }}>
                  {u.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Overdue date */}
        {overdue && (
          <span className="text-[11px] font-mono text-destructive tabular-nums flex-shrink-0">
            {formatShortDate(event.date)}
          </span>
        )}

        {/* Project tag */}
        {showProjectTag && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium flex-shrink-0 hidden sm:inline"
            style={{ color: projectColor, backgroundColor: projectColor + "22" }}
          >
            {projectName}
          </span>
        )}

        {/* Recurrence badge */}
        {event.recurrence !== "none" && (
          <span className="text-[10px] text-muted-foreground bg-surface px-1.5 py-0.5 rounded-sm font-mono flex-shrink-0">
            {RECURRENCE_META[event.recurrence as keyof typeof RECURRENCE_META]?.label}
          </span>
        )}

        {/* Add intent (only if current user is assignee and event not done) */}
        {!doneByAnyone && isCurrentUserAssigned && !intent && !editingIntent && (
          <button
            onClick={() => { setIntentDraft(""); setEditingIntent(true); }}
            className="opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground hover:text-foreground transition-opacity flex-shrink-0"
            title="Add a plan note"
          >
            <Pencil size={11} />
          </button>
        )}
      </div>

      {/* Completions — who did it and when */}
      {completions.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-1.5 px-6 -mt-0.5">
          {completions.map((c, i) => {
            const who = users.find((u) => u.id === c.userId);
            return (
              <span key={i} className="text-[11px] font-mono" style={{ color: who?.color ?? "#888" }}>
                ✓ {who?.name ?? "Someone"} · {formatTime(c.completedAt)}
              </span>
            );
          })}
        </div>
      )}

      {/* Intent note */}
      {intent && !editingIntent && (
        <div className="flex items-center gap-2 pb-1.5 px-6 -mt-0.5">
          <span className="text-[11px] text-muted-foreground italic">
            {users.find((u) => u.id === intent.userId)?.name ?? "Someone"}: &ldquo;{intent.note}&rdquo;
          </span>
          {currentUser?.id === intent.userId && (
            <button onClick={onClearIntent} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={10} />
            </button>
          )}
        </div>
      )}

      {/* Intent edit form */}
      {editingIntent && (
        <form onSubmit={submitIntent} className="flex items-center gap-1.5 pb-1.5 px-6 -mt-0.5">
          <input
            autoFocus
            value={intentDraft}
            onChange={(e) => setIntentDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setEditingIntent(false); }}
            placeholder={`${currentUser?.name}: "I'll do this at..."`}
            className="flex-1 text-[11px] bg-panel border border-border-emphasized rounded px-2 py-0.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring italic"
          />
          <button type="submit" className="text-muted-foreground hover:text-foreground transition-colors">
            <Check size={11} />
          </button>
          <button type="button" onClick={() => setEditingIntent(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={11} />
          </button>
        </form>
      )}
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
