// ============================================================
// Homestead Manager — Seed Data
// ============================================================

import type { Project } from "./types";

/**
 * Create the default set of projects.
 * Projects are pre-populated but sections/items/events are empty —
 * the user fills those in based on their actual setup.
 */
export function createDefaultProjects(): Project[] {
  const now = new Date().toISOString();

  return [
    {
      id: "proj_fruit-trees",
      name: "Fruit trees",
      icon: "🍎",
      color: "lime",
      notes: "",
      sections: [],
      events: [],
      createdAt: now,
    },
    {
      id: "proj_bee-hives",
      name: "Bee hives",
      icon: "🐝",
      color: "amber",
      notes: "",
      sections: [],
      events: [],
      createdAt: now,
    },
    {
      id: "proj_chickens",
      name: "Chickens",
      icon: "🐔",
      color: "orange",
      notes: "",
      sections: [],
      events: [],
      createdAt: now,
    },
    {
      id: "proj_cannabis",
      name: "Cannabis",
      icon: "🌿",
      color: "teal",
      notes: "",
      sections: [],
      events: [],
      createdAt: now,
    },
    {
      id: "proj_vegetable-garden",
      name: "Vegetable garden",
      icon: "🥬",
      color: "purple",
      notes: "",
      sections: [],
      events: [],
      createdAt: now,
    },
    {
      id: "proj_cut-flowers",
      name: "Cut flowers",
      icon: "💐",
      color: "pink",
      notes: "",
      sections: [],
      events: [],
      createdAt: now,
    },
  ];
}

/**
 * Create a demo dataset with sections, items, and events populated.
 * Useful for development and testing.
 */
export function createDemoProjects(): Project[] {
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  return [
    {
      id: "proj_fruit-trees",
      name: "Fruit trees",
      icon: "🍎",
      color: "lime",
      notes:
        "Mixed orchard along the south fence line. Planted 2022-2024. Deer fencing installed around full perimeter. Drip irrigation on timer.",
      sections: [
        {
          id: "sec_apples",
          name: "Apples",
          type: "plant",
          details: { spacing: "15ft", sun: "Full sun" },
          items: [
            { id: "item_1", name: "Honeycrisp", variety: "M111 rootstock", qty: 2, date: "2022-04-15", notes: "South row", status: "active" },
            { id: "item_2", name: "Cortland", variety: "M111 rootstock", qty: 1, date: "2022-04-15", notes: "South row", status: "active" },
            { id: "item_3", name: "Liberty", variety: "M111 rootstock", qty: 1, date: "2023-04-20", notes: "Disease resistant", status: "active" },
          ],
        },
        {
          id: "sec_pears",
          name: "Pears",
          type: "plant",
          details: { spacing: "12ft", sun: "Full sun" },
          items: [
            { id: "item_4", name: "Bartlett", variety: "", qty: 2, date: "2023-04-20", notes: "", status: "active" },
          ],
        },
        {
          id: "sec_stone",
          name: "Stone fruit",
          type: "plant",
          details: {},
          items: [
            { id: "item_5", name: "Reliance Peach", variety: "", qty: 1, date: "2024-04-10", notes: "Cold hardy variety for Zone 6b", status: "active" },
          ],
        },
      ],
      events: [
        { id: "ev_1", title: "Prune before bud break", date: `${today.slice(0, 4)}-03-15`, recurrence: "none", priority: "high", projectId: "proj_fruit-trees", notes: "", completions: [] },
        { id: "ev_2", title: "Apply dormant oil spray", date: `${today.slice(0, 4)}-03-20`, recurrence: "none", priority: "high", projectId: "proj_fruit-trees", notes: "Dry + calm day required", completions: [] },
        { id: "ev_3", title: "Deep water if <1\" rain", date: `${today.slice(0, 4)}-06-01`, recurrence: "weekly", priority: "medium", projectId: "proj_fruit-trees", notes: "", completions: [] },
        { id: "ev_4", title: "Monitor for pests", date: `${today.slice(0, 4)}-05-15`, recurrence: "weekly", priority: "high", projectId: "proj_fruit-trees", notes: "Codling moth, aphids", completions: [] },
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
          id: "sec_hive1",
          name: "Hive #1",
          type: "animal",
          details: { breed: "Italian", housing: "10-frame Langstroth" },
          items: [
            { id: "item_6", name: "Queen — marked blue", variety: "Italian", qty: 1, date: "2024-05-01", notes: "Strong producer", status: "active" },
          ],
        },
        {
          id: "sec_hive2",
          name: "Hive #2",
          type: "animal",
          details: { breed: "Carniolan", housing: "10-frame Langstroth" },
          items: [
            { id: "item_7", name: "Queen — marked blue", variety: "Carniolan", qty: 1, date: "2024-05-01", notes: "Gentle, good overwintering", status: "active" },
          ],
        },
        {
          id: "sec_bee-equip",
          name: "Equipment",
          type: "equipment",
          details: {},
          items: [
            { id: "item_8", name: "Honey extractor", variety: "2-frame manual", qty: 1, date: "2024-04-15", notes: "", status: "active" },
          ],
        },
      ],
      events: [
        { id: "ev_5", title: "Hive inspection", date: `${today.slice(0, 4)}-04-15`, recurrence: "biweekly", priority: "high", projectId: "proj_bee-hives", notes: "Check brood pattern, queen, food stores", completions: [] },
        { id: "ev_6", title: "Varroa mite check", date: `${today.slice(0, 4)}-04-15`, recurrence: "monthly", priority: "high", projectId: "proj_bee-hives", notes: "Sugar roll — treat if >3%", completions: [] },
        { id: "ev_7", title: "Check for swarm cells", date: `${today.slice(0, 4)}-04-15`, recurrence: "weekly", priority: "high", projectId: "proj_bee-hives", sectionId: "sec_hive1", notes: "", completions: [] },
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
          id: "sec_flock",
          name: "The flock",
          type: "animal",
          details: { count: "12", housing: "8x10 coop + run" },
          items: [
            { id: "item_9", name: "Rhode Island Reds", variety: "RIR", qty: 6, date: "2024-03-15", notes: "Good layers, ~5 eggs/day total", status: "active" },
            { id: "item_10", name: "Buff Orpingtons", variety: "BO", qty: 6, date: "2024-03-15", notes: "Friendly, ~4 eggs/day total", status: "active" },
          ],
        },
        {
          id: "sec_coop-auto",
          name: "Coop automation",
          type: "initiative",
          details: { status: "In progress", goal: "Fully automated door, water, light" },
          items: [
            { id: "item_11", name: "ChickenGuard door", variety: "Premium", qty: 1, date: "2025-03-01", notes: "Installed, working well", status: "completed" },
            { id: "item_12", name: "Heated waterer base", variety: "", qty: 1, date: "", notes: "Need for next winter", status: "planned" },
            { id: "item_13", name: "Supplemental light timer", variety: "", qty: 1, date: "", notes: "14hr light for winter laying", status: "planned" },
          ],
        },
      ],
      events: [
        { id: "ev_8", title: "Collect eggs", date: `${today}`, recurrence: "daily", priority: "high", projectId: "proj_chickens", notes: "Morning + afternoon", completions: [] },
        { id: "ev_9", title: "Refresh water", date: `${today}`, recurrence: "daily", priority: "high", projectId: "proj_chickens", notes: "", completions: [] },
        { id: "ev_10", title: "Deep clean coop", date: `${today.slice(0, 4)}-04-01`, recurrence: "monthly", priority: "medium", projectId: "proj_chickens", notes: "Replace all bedding", completions: [] },
      ],
      createdAt: now,
    },
    {
      id: "proj_cannabis",
      name: "Cannabis",
      icon: "🌿",
      color: "teal",
      notes: "Outdoor personal grow. 6 plants max (MA legal limit). South-facing bed with amended soil. Last frost ~May 15.",
      sections: [
        {
          id: "sec_outdoor-grow",
          name: "Outdoor grow 2026",
          type: "plant",
          details: { sun: "Full sun", water_needs: "Heavy" },
          items: [],
        },
      ],
      events: [
        { id: "ev_11", title: "Start seeds indoors", date: `${today.slice(0, 4)}-04-01`, recurrence: "none", priority: "high", projectId: "proj_cannabis", notes: "4-6 weeks before last frost", completions: [] },
        { id: "ev_12", title: "Transplant outdoors", date: `${today.slice(0, 4)}-05-20`, recurrence: "none", priority: "high", projectId: "proj_cannabis", notes: "After last frost", completions: [] },
      ],
      createdAt: now,
    },
    {
      id: "proj_vegetable-garden",
      name: "Vegetable garden",
      icon: "🥬",
      color: "purple",
      notes: "Raised beds along the south side. 6 beds total, 4x8 each. Drip irrigation on zones.",
      sections: [],
      events: [],
      createdAt: now,
    },
    {
      id: "proj_cut-flowers",
      name: "Cut flowers",
      icon: "💐",
      color: "pink",
      notes: "Aspirational — planning for 2026. Want to start with dahlias, zinnias, and sunflowers.",
      sections: [],
      events: [],
      createdAt: now,
    },
  ];
}
