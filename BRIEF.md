# Homestead Manager — product brief

## Overview

A personal homestead operations app for managing a multi-zone property in Duxbury, MA (Zone 6b). Six zones: fruit trees, bee hives, chickens, cannabis, vegetable garden, and cut flowers. Replaces scattered notes, calendar reminders, and mental load with a single dense, information-rich dashboard.

Personal tool, not SaaS. Optimize for power-user density, not onboarding.

---

## Data model

### Project

Top-level organizational unit. Pre-seeded with six, user can add more.

```typescript
interface Project {
  id: string
  name: string
  icon: string                    // emoji or icon key
  color: string                   // hex from project palette
  notes: string                   // free-text "what are we working with"
  sections: Section[]
  events: Event[]
  createdAt: string               // ISO date
}
```

### Section

Logical grouping within a project. The key organizational layer.

Examples by project:
- Vegetable garden → "Tomatoes", "Peppers", "Garlic", "Cover crops"
- Chickens → "The flock", "Coop automation", "Egg tracking"
- Bee hives → "Hive #1", "Hive #2", "Equipment"
- Fruit trees → "Apples", "Pears", "Stone fruit"
- Cannabis → "Outdoor grow", "Drying/curing setup"
- Cut flowers → "Dahlias", "Zinnias", "Bulbs"

```typescript
type SectionType = "plant" | "animal" | "initiative" | "equipment"

interface Section {
  id: string
  name: string
  type: SectionType
  details: Record<string, string>  // flexible key-value metadata
  items: Item[]
}
```

The `type` field determines what detail fields to surface:
- **plant**: spacing, sun, days to maturity, water needs
- **animal**: breed, count, age, housing
- **initiative**: status, goal, budget, timeline
- **equipment**: model, purchase date, maintenance schedule

### Item

Atomic unit within a section.

```typescript
type ItemStatus = "active" | "planned" | "completed" | "archived"

interface Item {
  id: string
  name: string
  variety: string                 // breed, cultivar, model — optional
  qty: number
  date: string                    // planted, acquired, or started
  notes: string
  status: ItemStatus
}
```

### Event

Calendar entry tied to a project. Events are the heartbeat of the app.

```typescript
type Recurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly" | "seasonal"
type Priority = "high" | "medium" | "low"

interface Event {
  id: string
  title: string
  date: string                    // ISO date — start date for recurring
  recurrence: Recurrence
  priority: Priority
  projectId: string
  sectionId?: string              // optional — ties event to a specific section
  notes: string
  completions: string[]           // array of ISO dates when this event was marked done
}
```

**Recurrence logic:**
- `weekly`: every 7 days from start date
- `biweekly`: every 14 days from start date
- `monthly`: same day-of-month
- `seasonal`: quarterly from start date
- Completing a recurring event adds today's date to `completions[]` — doesn't delete the event
- An event instance is "done" if today's date (or the rendered date) is in `completions[]`

---

## Views

### 1. Sidebar (persistent, left, 210px)

```
┌──────────────────────┐
│  🌱 Homestead        │
│                      │
│  📅 Calendar         │
│  ☀️  Today            │
│                      │
│  PROJECTS            │
│  ● Fruit trees     3 │
│  ● Bee hives       2 │
│  ● Chickens        3 │
│  ● Cannabis        2 │
│  ● Vegetable gdn   5 │
│  ● Cut flowers     1 │
│                      │
│  + Add project       │
└──────────────────────┘
```

- Color dot per project (from palette)
- Number = section count
- Active item: project color tint on background + left border accent
- Collapsible on narrow viewports

### 2. Project detail view

When a project is selected:

**Header area:**
- Project icon + name (22px)
- Summary: "3 sections · 12 items · 5 upcoming events"
- Project color as accent throughout

**Details / notes panel:**
- Editable free-text block
- "What are we working with" — varieties, setup, goals, overall status
- Edit mode: textarea with save/cancel
- Example content: "12 hens — 6 Rhode Island Reds, 6 Buff Orpingtons. 8x10 coop with attached run. Automatic door installed March 2025. Considering adding quail."

**Sections list:**
- Expandable cards, collapsed by default
- Each shows: type badge, name, item count, expand chevron
- Expanded view: compact table/list of items
  - Columns: name, variety, qty, date, status badge
  - Inline "add item" form at bottom
  - Remove item: trash icon on hover

**Events panel:**
- Below sections
- List of events sorted by next occurrence
- Each row: priority dot, title, date (mono font), recurrence badge, checkbox
- Inline "add event" quick form
- Completed events: strikethrough + 50% opacity

### 3. Calendar view

Full month grid with project overlays.

**Top bar:**
- "Calendar" title (22px)
- Month/year with prev/next arrows
- Project toggle pills (color-coded, all active by default, click to hide/show)

**Month grid:**
- 7-column grid, day cells
- Each cell: day number + colored dots for events (max 4 visible, "+N" if more)
- Today: subtle accent border
- Selected day: stronger accent border
- Clicking a day opens detail panel below

**Day detail panel (below grid when a day is selected):**
- Full date header
- All events for that day, grouped by project
- Each event: project color left-border, priority dot, title, recurrence badge, done checkbox
- "Add event" button scoped to selected date

### 4. Today view

Daily operations dashboard. Most information-dense view.

**Layout:**
```
┌─────────────────────────────────────────┐
│  Thursday, April 9        ☀️ 58°F       │
├────────────┬────────────┬───────────────┤
│ Tasks: 14  │ Done: 3    │ Overdue: 2    │
├────────────┴────────────┴───────────────┤
│                                         │
│  HIGH PRIORITY                          │
│  ● Check water 2x (freezing)  Chickens  │
│  ● Collect eggs early         Chickens  │
│  ● Monitor varroa             Bees      │
│                                         │
│  🍎 FRUIT TREES                         │
│  □ Prune before bud break     weekly    │
│  □ Check for winter damage    once      │
│                                         │
│  🐝 BEE HIVES                           │
│  □ First hive inspection      once      │
│  □ Check food stores          weekly    │
│  ☑ Monitor varroa             monthly   │
│                                         │
│  (etc. for each active project)         │
└─────────────────────────────────────────┘
```

- Metric cards at top: total tasks, completed, overdue
- High priority section pulls all high-priority events across projects
- Then grouped by project with project color headers
- Checkbox interaction marks the event done for today

---

## Interactions

| Action | Pattern |
|--------|---------|
| Add section | Inline form within project view. Fields: name, type dropdown |
| Add item | Inline form within expanded section. Fields adapt by section type |
| Add event | Inline form in events panel. Fields: title, date, recurrence, priority, notes |
| Edit project notes | Click edit → textarea appears → save/cancel |
| Complete event | Checkbox on row. Adds today to completions array |
| Delete anything | Trash icon on hover → inline "remove?" confirmation text → confirm/cancel |
| Toggle calendar project | Click pill → toggles visibility (no page reload) |

All inline. No modals. No confirmation dialogs. No toast notifications.

---

## Persistence (V1)

Use localStorage with a single key:

```typescript
// lib/storage.ts
const STORAGE_KEY = "homestead-data"

interface AppData {
  projects: Project[]
  version: number              // for future migrations
}

function load(): AppData
function save(data: AppData): void
```

- Auto-save on every state change (debounced 500ms)
- Load on app mount
- Version field enables future schema migrations
- When multi-device sync is needed (V2), swap storage.ts internals for Supabase — the rest of the app doesn't change

---

## Implementation roadmap

### Phase 1 — scaffold (do first)

1. `npx create-next-app@latest homestead --typescript --tailwind --app --src-dir`
2. Install: `geist` (font), `shadcn/ui` init with dark theme, `lucide-react` (icons), `nanoid` (IDs)
3. Set up Tailwind config with the color system from CLAUDE.md
4. Create `/src/lib/types.ts` with all interfaces
5. Create `/src/lib/storage.ts` with load/save
6. Create `/src/lib/calendar.ts` with recurrence calculation and date helpers
7. Create `/src/lib/colors.ts` with project color palette
8. Create `/src/lib/seed.ts` with default project data

### Phase 2 — layout and navigation

1. App layout: sidebar + main content area
2. Sidebar component with project list and nav buttons
3. State management: React context with `useReducer` for app state
4. Route between views: project detail, calendar, today (can be client-side state, not URL routes)

### Phase 3 — project detail view

1. Project header with icon, name, stats
2. Notes panel with edit mode
3. Section cards (expandable)
4. Item rows within sections
5. Add section form
6. Add item form (type-adaptive)
7. Events list with add form
8. Delete flows for items, sections, events

### Phase 4 — calendar view

1. Month grid component
2. Event dot rendering with project colors
3. Project toggle pills
4. Day selection and detail panel
5. Recurrence instance generation
6. Done checkbox on calendar events

### Phase 5 — today view

1. Daily event aggregation across all projects
2. Metric cards (total, done, overdue)
3. Priority grouping
4. Project grouping
5. Done checkboxes

### Phase 6 — polish

1. Keyboard shortcuts (n = new event, / = search, 1-6 = jump to project)
2. Mobile responsive: sidebar collapses to hamburger
3. Data export (JSON download)
4. Favicon and metadata

---

## Future features (design for, don't build yet)

- **Seasonal task templates**: pre-built event sets by project and season for Zone 6b
- **Automation tips**: per-section recommendations (simple vs smart/IoT tiers)
- **Photo log**: attach images to items/sections
- **Weather integration**: local weather data with relevant alerts
- **Calendar export**: .ics file generation
- **AI assistant**: "Ask Claude" button with project context
- **Multi-device sync**: swap localStorage for Supabase/Vercel KV
