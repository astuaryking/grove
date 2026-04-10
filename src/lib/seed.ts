// ============================================================
// Homestead Manager — Seed Data
// ============================================================

import type { Project, User } from "./types";

export const DEFAULT_USER_ID = "user_you";
export const DEFAULT_MOM_ID = "user_mom";

export function createDefaultUsers(): User[] {
  return [
    { id: DEFAULT_USER_ID, name: "You", color: "#a3e635" },
    { id: DEFAULT_MOM_ID, name: "Mom", color: "#f472b6" },
  ];
}

const EMPTY_EVENT_FIELDS = {
  assignees: [] as string[],
  completionLog: [] as { date: string; userId: string; completedAt: string }[],
  intents: [] as { date: string; userId: string; note: string }[],
};

export function createDefaultProjects(): Project[] {
  const now = new Date().toISOString();

  return [
    { id: "proj_fruit-trees", name: "Fruit trees", icon: "🍎", color: "lime", notes: "", sections: [], events: [], createdAt: now },
    { id: "proj_bee-hives", name: "Bee hives", icon: "🐝", color: "amber", notes: "", sections: [], events: [], createdAt: now },
    { id: "proj_chickens", name: "Chickens", icon: "🐔", color: "orange", notes: "", sections: [], events: [], createdAt: now },
    { id: "proj_cannabis", name: "Cannabis", icon: "🌿", color: "teal", notes: "", sections: [], events: [], createdAt: now },
    { id: "proj_vegetable-garden", name: "Vegetable garden", icon: "🥬", color: "purple", notes: "", sections: [], events: [], createdAt: now },
    { id: "proj_cut-flowers", name: "Cut flowers", icon: "💐", color: "pink", notes: "", sections: [], events: [], createdAt: now },
  ];
}

export function createDemoProjects(): Project[] {
  const now = new Date().toISOString();
  const today = now.split("T")[0];
  const yr = today.slice(0, 4);

  return [
    {
      id: "proj_fruit-trees",
      name: "Fruit trees",
      icon: "🍎",
      color: "lime",
      notes: "Mixed orchard along the south fence line. Planted 2022-2024. Deer fencing installed around full perimeter. Drip irrigation on timer.",
      sections: [
        {
          id: "sec_apples", name: "Apples", type: "plant", details: { spacing: "15ft", sun: "Full sun" },
          items: [
            { id: "item_1", name: "Honeycrisp", variety: "M111 rootstock", qty: 2, date: "2022-04-15", notes: "South row", status: "active" },
            { id: "item_2", name: "Cortland", variety: "M111 rootstock", qty: 1, date: "2022-04-15", notes: "South row", status: "active" },
          ],
        },
      ],
      events: [
        { id: "ev_1", title: "Prune before bud break", date: `${yr}-03-15`, recurrence: "none", priority: "high", projectId: "proj_fruit-trees", notes: "", ...EMPTY_EVENT_FIELDS, assignees: [DEFAULT_USER_ID] },
        { id: "ev_3", title: "Deep water if <1\" rain", date: `${yr}-06-01`, recurrence: "weekly", priority: "medium", projectId: "proj_fruit-trees", notes: "", ...EMPTY_EVENT_FIELDS },
      ],
      createdAt: now,
    },
    {
      id: "proj_bee-hives",
      name: "Bee hives",
      icon: "🐝",
      color: "amber",
      notes: "Two Langstroth hives, east side of property near the wildflower strip. Started from nucs in 2024.",
      sections: [
        {
          id: "sec_hive1", name: "Hive #1", type: "animal", details: { breed: "Italian", housing: "10-frame Langstroth" },
          items: [{ id: "item_6", name: "Queen — marked blue", variety: "Italian", qty: 1, date: "2024-05-01", notes: "Strong producer", status: "active" }],
        },
      ],
      events: [
        { id: "ev_5", title: "Hive inspection", date: `${yr}-04-15`, recurrence: "biweekly", priority: "high", projectId: "proj_bee-hives", notes: "Check brood pattern, queen, food stores", ...EMPTY_EVENT_FIELDS, assignees: [DEFAULT_USER_ID] },
        { id: "ev_6", title: "Varroa mite check", date: `${yr}-04-15`, recurrence: "monthly", priority: "high", projectId: "proj_bee-hives", notes: "Sugar roll — treat if >3%", ...EMPTY_EVENT_FIELDS, assignees: [DEFAULT_USER_ID] },
      ],
      createdAt: now,
    },
    {
      id: "proj_chickens",
      name: "Chickens",
      icon: "🐔",
      color: "orange",
      notes: "12 hens — 6 Rhode Island Reds, 6 Buff Orpingtons. 8x10 coop with attached run. Automatic door installed March 2025.",
      sections: [
        {
          id: "sec_flock", name: "The flock", type: "animal", details: { count: "12", housing: "8x10 coop + run" },
          items: [
            { id: "item_9", name: "Rhode Island Reds", variety: "RIR", qty: 6, date: "2024-03-15", notes: "Good layers", status: "active" },
            { id: "item_10", name: "Buff Orpingtons", variety: "BO", qty: 6, date: "2024-03-15", notes: "Friendly", status: "active" },
          ],
        },
      ],
      events: [
        { id: "ev_8", title: "Collect eggs", date: today, recurrence: "daily", priority: "high", projectId: "proj_chickens", notes: "Morning + afternoon", ...EMPTY_EVENT_FIELDS, assignees: [DEFAULT_MOM_ID] },
        { id: "ev_9", title: "Refresh water", date: today, recurrence: "daily", priority: "high", projectId: "proj_chickens", notes: "", ...EMPTY_EVENT_FIELDS, assignees: [DEFAULT_MOM_ID] },
        { id: "ev_10", title: "Deep clean coop", date: `${yr}-04-01`, recurrence: "monthly", priority: "medium", projectId: "proj_chickens", notes: "Replace all bedding", ...EMPTY_EVENT_FIELDS },
      ],
      createdAt: now,
    },
    {
      id: "proj_cannabis", name: "Cannabis", icon: "🌿", color: "teal",
      notes: "Outdoor personal grow. 6 plants max (MA legal limit). South-facing bed.",
      sections: [],
      events: [
        { id: "ev_11", title: "Start seeds indoors", date: `${yr}-04-01`, recurrence: "none", priority: "high", projectId: "proj_cannabis", notes: "4-6 weeks before last frost", ...EMPTY_EVENT_FIELDS },
      ],
      createdAt: now,
    },
    { id: "proj_vegetable-garden", name: "Vegetable garden", icon: "🥬", color: "purple", notes: "Raised beds along the south side.", sections: [], events: [], createdAt: now },
    { id: "proj_cut-flowers", name: "Cut flowers", icon: "💐", color: "pink", notes: "Aspirational — planning for 2026.", sections: [], events: [], createdAt: now },
  ];
}
