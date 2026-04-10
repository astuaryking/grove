// ============================================================
// Homestead Manager — Persistence
// ============================================================

import type { AppData } from "./types";
import { createDefaultProjects, createDefaultUsers, DEFAULT_USER_ID } from "./seed";

const STORAGE_KEY = "homestead-data";
const CURRENT_VERSION = 2;

export function loadAppData(): AppData {
  if (typeof window === "undefined") return createDefaultData();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch (err) {
    console.error("Failed to load homestead data, using defaults:", err);
    return createDefaultData();
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: CURRENT_VERSION }));
  } catch (err) {
    console.error("Failed to save homestead data:", err);
  }
}

export function exportAppData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `homestead-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAppData(json: string): AppData | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.projects || !Array.isArray(parsed.projects)) return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function clearAppData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// --- Internal ---

function createDefaultData(): AppData {
  const users = createDefaultUsers();
  return {
    projects: createDefaultProjects(),
    users,
    currentUserId: users[0].id,
    version: CURRENT_VERSION,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(data: any): AppData {
  let current = { ...data };

  // v0 → v1: ensure completions array exists
  if (!current.version || current.version < 1) {
    current.projects = current.projects.map((p: any) => ({
      ...p,
      events: (p.events || []).map((e: any) => ({
        ...e,
        completions: e.completions ?? [],
      })),
      createdAt: p.createdAt || new Date().toISOString(),
    }));
    current.version = 1;
  }

  // v1 → v2: users, assignees, completionLog, intents
  if (current.version < 2) {
    const defaultUsers = createDefaultUsers();
    current.users = current.users ?? defaultUsers;
    current.currentUserId = current.currentUserId ?? defaultUsers[0].id;

    current.projects = current.projects.map((p: any) => ({
      ...p,
      events: (p.events || []).map((e: any) => ({
        ...e,
        assignees: e.assignees ?? [],
        // Convert old completions string[] → completionLog
        completionLog: (e.completionLog ?? (e.completions ?? []).map((date: string) => ({
          date,
          userId: DEFAULT_USER_ID,
          completedAt: date + "T12:00:00.000Z",
        }))),
        intents: e.intents ?? [],
      })),
    }));
    current.version = 2;
  }

  return current as AppData;
}
