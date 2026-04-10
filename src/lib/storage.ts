// ============================================================
// Grove — Persistence
// ============================================================

import type { AppData, User } from "./types";
import { createDefaultProjects, createDefaultUsers, DEFAULT_USER_ID, DEFAULT_WIFE_ID } from "./seed";

const STORAGE_KEY = "homestead-data";
const CURRENT_VERSION = 4;

export function loadAppData(): AppData {
  if (typeof window === "undefined") return createDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.error("Failed to load Grove data, using defaults:", err);
    return createDefaultData();
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: CURRENT_VERSION }));
  } catch (err) {
    console.error("Failed to save Grove data:", err);
  }
}

export function exportAppData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grove-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAppData(json: string): AppData | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.projects || !Array.isArray(parsed.projects)) return null;
    return migrate(parsed);
  } catch { return null; }
}

export function clearAppData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// --- Internal ---

function createDefaultData(): AppData {
  const users = createDefaultUsers();
  return { projects: createDefaultProjects(), users, currentUserId: users[0].id, shoppingList: [], version: CURRENT_VERSION };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(data: any): AppData {
  let d = { ...data };

  if (!d.version || d.version < 1) {
    d.projects = d.projects.map((p: any) => ({
      ...p,
      events: (p.events || []).map((e: any) => ({ ...e, completions: e.completions ?? [] })),
      createdAt: p.createdAt || new Date().toISOString(),
    }));
    d.version = 1;
  }

  if (d.version < 2) {
    const defaultUsers = createDefaultUsers();
    d.users = d.users ?? defaultUsers;
    d.currentUserId = d.currentUserId ?? defaultUsers[0].id;
    d.projects = d.projects.map((p: any) => ({
      ...p,
      events: (p.events || []).map((e: any) => ({
        ...e,
        assignees: e.assignees ?? [],
        completionLog: e.completionLog ?? (e.completions ?? []).map((date: string) => ({
          date, userId: DEFAULT_USER_ID, completedAt: date + "T12:00:00.000Z",
        })),
        intents: e.intents ?? [],
      })),
    }));
    d.version = 2;
  }

  if (d.version < 3) {
    d.shoppingList = d.shoppingList ?? [];
    d.version = 3;
  }

  if (d.version < 4) {
    // Add Wife if not present
    const hasWife = (d.users as User[]).some((u) => u.id === DEFAULT_WIFE_ID);
    if (!hasWife) {
      const wifeIdx = (d.users as User[]).findIndex((u) => u.id === "user_mom");
      const wife: User = { id: DEFAULT_WIFE_ID, name: "Wife", color: "#60a5fa" };
      if (wifeIdx >= 0) {
        d.users = [...(d.users as User[]).slice(0, wifeIdx), wife, ...(d.users as User[]).slice(wifeIdx)];
      } else {
        d.users = [...(d.users as User[]), wife];
      }
    }
    d.version = 4;
  }

  return d as AppData;
}
