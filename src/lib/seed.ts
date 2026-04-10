// ============================================================
// Grove — Seed Data
// ============================================================

import type { Project, User } from "./types";

export const DEFAULT_USER_ID  = "user_me";
export const DEFAULT_WIFE_ID  = "user_wife";
export const DEFAULT_MOM_ID   = "user_mom";

export function createDefaultUsers(): User[] {
  return [
    { id: DEFAULT_USER_ID,  name: "Me",   color: "#a3e635" },
    { id: DEFAULT_WIFE_ID,  name: "Wife", color: "#60a5fa" },
    { id: DEFAULT_MOM_ID,   name: "Mom",  color: "#f472b6" },
  ];
}

const BLANK = {
  assignees:     [] as string[],
  completionLog: [] as { date: string; userId: string; completedAt: string }[],
  intents:       [] as { date: string; userId: string; note: string }[],
};

export function createDefaultProjects(): Project[] {
  const now = new Date().toISOString();
  return [
    { id: "proj_fruit-trees",      name: "Fruit trees",      icon: "🍎", color: "lime",   notes: "", members: [], sections: [], events: [], createdAt: now },
    { id: "proj_bee-hives",        name: "Bee hives",        icon: "🐝", color: "amber",  notes: "", members: [], sections: [], events: [], createdAt: now },
    { id: "proj_chickens",         name: "Chickens",         icon: "🐔", color: "orange", notes: "", members: [], sections: [], events: [], createdAt: now },
    { id: "proj_cannabis",         name: "Cannabis",         icon: "🌿", color: "teal",   notes: "", members: [], sections: [], events: [], createdAt: now },
    { id: "proj_vegetable-garden", name: "Vegetable garden", icon: "🥬", color: "purple", notes: "", members: [], sections: [], events: [], createdAt: now },
    { id: "proj_cut-flowers",      name: "Cut flowers",      icon: "💐", color: "pink",   notes: "", members: [], sections: [], events: [], createdAt: now },
  ];
}
