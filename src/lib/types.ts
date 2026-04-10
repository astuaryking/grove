// ============================================================
// Grove — Core Types
// ============================================================

export type SectionType = "plant" | "animal" | "initiative" | "equipment";
export type ItemStatus = "active" | "planned" | "completed" | "archived";
export type Recurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly" | "seasonal";
export type Priority = "high" | "medium" | "low";
export type ViewId = "today" | "calendar" | "project" | "shopping";

// --- People ---

/** A person in the household. currentUserId identifies which one "I" am on this device. */
export interface User {
  id: string;
  name: string;
  color: string; // hex
}

// --- Collaboration ---

export interface Completion {
  date: string;        // ISO date — the occurrence completed
  userId: string;
  completedAt: string; // ISO datetime
}

export interface Intent {
  date: string;
  userId: string;
  note: string;
}

// --- Project primitives ---

export interface Item {
  id: string;
  name: string;
  variety: string;
  qty: number;
  date: string;
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
  assignees: string[];
  completionLog: Completion[];
  intents: Intent[];
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

// --- Shopping list ---

export interface ShoppingItem {
  id: string;
  name: string;
  qty: number;
  unit: string;       // "bags", "lbs", "each", "pack", …
  store: string;      // "Agway", "Amazon", "Home Depot", …
  projectId?: string; // optional project link
  assignees: string[];
  notes: string;
  purchased: boolean;
  purchasedAt?: string;  // ISO datetime
  purchasedBy?: string;  // userId
  createdAt: string;
}

// --- App data ---

export interface AppData {
  projects: Project[];
  users: User[];
  currentUserId: string; // which user "I" am on this device
  shoppingList: ShoppingItem[];
  version: number;
}

// --- Metadata ---

export const SECTION_TYPE_META: Record<SectionType, { label: string; detailFields: string[] }> = {
  plant:     { label: "Plants / crops",            detailFields: ["spacing", "sun", "days_to_maturity", "water_needs"] },
  animal:    { label: "Animals / livestock",       detailFields: ["breed", "count", "age", "housing"] },
  initiative:{ label: "Initiative / project",      detailFields: ["status", "goal", "budget", "timeline"] },
  equipment: { label: "Equipment / infrastructure",detailFields: ["model", "purchase_date", "maintenance_schedule"] },
};

export const PRIORITY_META: Record<Priority, { label: string; order: number }> = {
  high:   { label: "High",   order: 0 },
  medium: { label: "Medium", order: 1 },
  low:    { label: "Low",    order: 2 },
};

export const RECURRENCE_META: Record<Recurrence, { label: string }> = {
  none:     { label: "One-time" },
  daily:    { label: "Daily" },
  weekly:   { label: "Weekly" },
  biweekly: { label: "Biweekly" },
  monthly:  { label: "Monthly" },
  seasonal: { label: "Seasonal" },
};
