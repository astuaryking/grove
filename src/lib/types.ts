// ============================================================
// Homestead Manager — Core Types
// ============================================================

// --- Enums & unions ---

export type SectionType = "plant" | "animal" | "initiative" | "equipment";

export type ItemStatus = "active" | "planned" | "completed" | "archived";

export type Recurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly" | "seasonal";

export type Priority = "high" | "medium" | "low";

export type ViewId = "today" | "calendar" | "project";

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
  details: Record<string, string>; // flexible key-value metadata
  items: Item[];
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO date — start date for recurring events
  recurrence: Recurrence;
  priority: Priority;
  projectId: string;
  sectionId?: string;
  notes: string;
  completions: string[]; // ISO dates when marked done
}

export interface Project {
  id: string;
  name: string;
  icon: string;
  color: string; // hex from project palette
  notes: string;
  sections: Section[];
  events: Event[];
  createdAt: string; // ISO date
}

// --- App state ---

export interface AppData {
  projects: Project[];
  version: number; // for future schema migrations
}

// --- Section type field hints ---
// Used by the UI to render appropriate detail fields per section type

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

export const PRIORITY_META: Record<Priority, { label: string; order: number }> =
  {
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
