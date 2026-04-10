// ============================================================
// Homestead Manager — Calendar Utilities
// ============================================================

import type { Event, Priority } from "./types";
import { PRIORITY_META } from "./types";

// --- Date formatting ---

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export { MONTHS, MONTHS_SHORT, DAYS_SHORT };

/**
 * Format a Date to ISO date string (YYYY-MM-DD).
 */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse an ISO date string to a Date (noon local, avoids timezone edge cases).
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00");
}

/**
 * Get today's date string.
 */
export function todayStr(): string {
  return toDateStr(new Date());
}

/**
 * Format a date string for display: "Thu, Apr 9"
 */
export function formatDateShort(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${DAYS_SHORT[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Format a date string for display: "Thursday, April 9, 2026"
 */
export function formatDateLong(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// --- Month grid helpers ---

export interface MonthGrid {
  year: number;
  month: number; // 0-indexed
  firstDayOfWeek: number; // 0 = Sunday
  daysInMonth: number;
}

export function getMonthGrid(year: number, month: number): MonthGrid {
  return {
    year,
    month,
    firstDayOfWeek: new Date(year, month, 1).getDay(),
    daysInMonth: new Date(year, month + 1, 0).getDate(),
  };
}

/**
 * Build the date string for a given day in a month grid.
 */
export function gridDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// --- Recurrence ---

/**
 * Check if a recurring event fires on a given date.
 */
export function eventFiresOnDate(event: Event, dateStr: string): boolean {
  const { date: startDate, recurrence } = event;

  if (startDate > dateStr) return false;

  if (recurrence === "none") {
    return startDate === dateStr;
  }

  if (recurrence === "daily") {
    return true;
  }

  const start = parseDate(startDate);
  const check = parseDate(dateStr);
  const diffDays = Math.round(
    (check.getTime() - start.getTime()) / 86_400_000
  );

  if (recurrence === "weekly") {
    return diffDays >= 0 && diffDays % 7 === 0;
  }

  if (recurrence === "biweekly") {
    return diffDays >= 0 && diffDays % 14 === 0;
  }

  if (recurrence === "monthly") {
    const startDay = start.getDate();
    const checkDay = check.getDate();
    return startDay === checkDay && check >= start;
  }

  if (recurrence === "seasonal") {
    // Quarterly: fires if same day-of-month and month difference is multiple of 3
    const monthDiff =
      (check.getFullYear() - start.getFullYear()) * 12 +
      (check.getMonth() - start.getMonth());
    return (
      monthDiff >= 0 &&
      monthDiff % 3 === 0 &&
      start.getDate() === check.getDate()
    );
  }

  return false;
}

/**
 * Check if an event instance is completed for a given date (by any user).
 */
export function isEventDoneOnDate(event: Event, dateStr: string): boolean {
  return (event.completionLog ?? []).some((c) => c.date === dateStr);
}

/**
 * Check if an event instance is completed by a specific user on a given date.
 */
export function isEventDoneByUser(event: Event, dateStr: string, userId: string): boolean {
  return (event.completionLog ?? []).some((c) => c.date === dateStr && c.userId === userId);
}

/**
 * Get all completions for a specific date.
 */
export function getCompletionsForDate(event: Event, dateStr: string): import("./types").Completion[] {
  return (event.completionLog ?? []).filter((c) => c.date === dateStr);
}

/**
 * Get a user's intent for a specific date, if any.
 */
export function getIntentForUser(event: Event, dateStr: string, userId: string): import("./types").Intent | undefined {
  return (event.intents ?? []).find((i) => i.date === dateStr && i.userId === userId);
}

// --- Event aggregation ---

export interface EventInstance {
  event: Event;
  date: string;
  done: boolean;
}

/**
 * Get all event instances for a given date across multiple events.
 * Sorted by priority (high → medium → low).
 */
export function getEventsForDate(
  events: Event[],
  dateStr: string
): EventInstance[] {
  const instances: EventInstance[] = [];

  for (const event of events) {
    if (eventFiresOnDate(event, dateStr)) {
      instances.push({
        event,
        date: dateStr,
        done: isEventDoneOnDate(event, dateStr),
      });
    }
  }

  instances.sort(
    (a, b) =>
      PRIORITY_META[a.event.priority].order -
      PRIORITY_META[b.event.priority].order
  );

  return instances;
}

/**
 * Get all events from all projects for a given date.
 * Returns instances with project reference.
 */
export interface EventInstanceWithProject extends EventInstance {
  projectId: string;
  projectColor: string;
  projectName: string;
}

/**
 * Collect all events across projects for a given date,
 * filtered by a set of visible project IDs.
 */
export function getAllEventsForDate(
  projects: { id: string; name: string; color: string; events: Event[] }[],
  dateStr: string,
  visibleProjectIds: Set<string>
): EventInstanceWithProject[] {
  const instances: EventInstanceWithProject[] = [];

  for (const project of projects) {
    if (!visibleProjectIds.has(project.id)) continue;

    for (const event of project.events) {
      if (eventFiresOnDate(event, dateStr)) {
        instances.push({
          event,
          date: dateStr,
          done: isEventDoneOnDate(event, dateStr),
          projectId: project.id,
          projectColor: project.color,
          projectName: project.name,
        });
      }
    }
  }

  instances.sort(
    (a, b) =>
      PRIORITY_META[a.event.priority].order -
      PRIORITY_META[b.event.priority].order
  );

  return instances;
}

/**
 * Count events on a date (for calendar dot display).
 * Returns a map of projectColor → count.
 */
export function countEventsOnDate(
  projects: { id: string; color: string; events: Event[] }[],
  dateStr: string,
  visibleProjectIds: Set<string>
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const project of projects) {
    if (!visibleProjectIds.has(project.id)) continue;

    let projectCount = 0;
    for (const event of project.events) {
      if (eventFiresOnDate(event, dateStr)) {
        projectCount++;
      }
    }

    if (projectCount > 0) {
      counts.set(project.color, projectCount);
    }
  }

  return counts;
}

// --- Overdue detection ---

/**
 * Get overdue non-recurring events (date is before today, not completed).
 */
export function getOverdueEvents(events: Event[], today: string): Event[] {
  return events.filter(
    (e) =>
      e.recurrence === "none" &&
      e.date < today &&
      !(e.completionLog ?? []).some((c) => c.date === e.date)
  );
}
