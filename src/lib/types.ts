// ============================================================
// Homestead Manager — Core Types
// ============================================================

// --- Enums & unions ---

export type SectionType = "plant" | "animal" | "initiative" | "equipment";

export type ItemStatus = "active" | "planned" | "completed" | "archived";

export type Recurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly" | "seasonal";

export type Priority = "high" | "medium" | "low";

export type ViewId = "today" | "calendar" | "project";

// --- Users ---

export interface User {
  id: string;
  name: string;
  color: string; // hex — used for avatar dot and task attribution
}

// --- Collaboration primitives ---

/** Records a completed instance of an event, by whom and when. */
export interface Completion {
  date: string;        // ISO date — the occurrence date that was completed
  userId: string;
  completedAt: string; // ISO datetime
}

/** A user's stated plan for a specific event instance. */
export interface Intent {
  date: string;    // ISO date — the occurrence date
  userId: string;
  note: string;    // e.g., "after lunch", "2pm"
}

// --- Primitives ---

export interface Item {
  id: string;
  name: string;
  variety: string;
  qty: number;
  date: string; // ISO date — planted, acquired, or started
  notes: string;
  status: ItemStatus;
}

export interface Section {
  id: string;
  name: string;
  type: SectionType;
  details: Record<string, string>;
  items: Item[];
}

export interface Event {
  id: string;
  title: string;
  date: string;
  recurrence: Recurrence;
  priority: Priority;
  projectId: string;
  sectionId?: string;
  notes: string;
  assignees: string[];       // user IDs responsible for this event
  completionLog: Completion[]; // who completed each occurrence and when
  intents: Intent[];           // who plans to do it, with a note
}

export interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
  notes: string;
  sections: Section[];
  events: Event[];
  createdAt: string;
}

// --- App data ---

export interface AppData {
  projects: Project[];
  users: User[];
  currentUserId: string;
  version: number;
}

// --- Section type field hints ---

export const SECTION_TYPE_META: Record<
  SectionType,
  { label: string; detailFields: string[] }
> = {
  plant: {
    label: "Plants / crops",
    detailFields: ["spacing", "sun", "days_to_maturity", "water_needs"],
  },
  animal: {
    label: "Animals / livestock",
    detailFields: ["breed", "count", "age", "housing"],
  },
  initiative: {
    label: "Initiative / project",
    detailFields: ["status", "goal", "budget", "timeline"],
  },
  equipment: {
    label: "Equipment / infrastructure",
    detailFields: ["model", "purchase_date", "maintenance_schedule"],
  },
};

// --- Priority meta ---

export const PRIORITY_META: Record<Priority, { label: string; order: number }> = {
  high: { label: "High", order: 0 },
  medium: { label: "Medium", order: 1 },
  low: { label: "Low", order: 2 },
};

// --- Recurrence meta ---

export const RECURRENCE_META: Record<Recurrence, { label: string }> = {
  none: { label: "One-time" },
  daily: { label: "Daily" },
  weekly: { label: "Weekly" },
  biweekly: { label: "Biweekly" },
  monthly: { label: "Monthly" },
  seasonal: { label: "Seasonal" },
};
