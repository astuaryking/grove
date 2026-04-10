// ============================================================
// Homestead Manager — Persistence
// ============================================================

import type { AppData } from "./types";
import { createDefaultProjects } from "./seed";

const STORAGE_KEY = "homestead-data";
const CURRENT_VERSION = 1;

/**
 * Load app data from localStorage.
 * Returns default seed data if nothing is stored or if parsing fails.
 */
export function loadAppData(): AppData {
  if (typeof window === "undefined") {
    return createDefaultData();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();

    const parsed: AppData = JSON.parse(raw);

    // Run migrations if version is behind
    const migrated = migrate(parsed);

    return migrated;
  } catch (err) {
    console.error("Failed to load homestead data, using defaults:", err);
    return createDefaultData();
  }
}

/**
 * Save app data to localStorage.
 * Call this on every state change (debounced in the consuming component).
 */
export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") return;

  try {
    const serialized = JSON.stringify({ ...data, version: CURRENT_VERSION });
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error("Failed to save homestead data:", err);
  }
}

/**
 * Export app data as a downloadable JSON file.
 */
export function exportAppData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `homestead-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import app data from a JSON file.
 * Returns the parsed data or null if invalid.
 */
export function importAppData(json: string): AppData | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.projects || !Array.isArray(parsed.projects)) return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

/**
 * Clear all stored data (returns to defaults on next load).
 */
export function clearAppData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// --- Internal ---

function createDefaultData(): AppData {
  return {
    projects: createDefaultProjects(),
    version: CURRENT_VERSION,
  };
}

/**
 * Run sequential migrations from stored version to current.
 * Add new migration functions here as the schema evolves.
 */
function migrate(data: AppData): AppData {
  let current = { ...data };

  // Example: migration from v0/undefined to v1
  if (!current.version || current.version < 1) {
    // v1: ensure all events have completions array
    current.projects = current.projects.map((p) => ({
      ...p,
      events: (p.events || []).map((e) => ({
        ...e,
        completions: e.completions ?? [],
      })),
      createdAt: p.createdAt || new Date().toISOString(),
    }));
    current.version = 1;
  }

  // Future: if (current.version < 2) { ... current.version = 2; }

  return current;
}
