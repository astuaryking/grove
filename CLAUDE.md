# Homestead Manager

Personal homestead operations dashboard for a multi-zone property in Duxbury, MA (USDA Zone 6b). Dark-first, information-dense, precision-engineered.

## Stack

- Next.js 14+ (App Router)
- TypeScript (strict)
- Tailwind CSS 4
- Geist font (sans + mono)
- shadcn/ui components (dark theme default)
- localStorage for persistence (V1)
- Deployed to Vercel

## Design system

### Philosophy

Linear.app precision meets Vercel dashboard meets Bloomberg terminal. Dense, fast, flat. No shadows, no border-radius larger than 8px, no delight animations. Speed is the feature.

### Colors

```
Background:       #0A0A0A (page), #111111 (surface), #141414 (card), #1A1A1A (hover)
Text:             #FAFAFA (primary), #888888 (secondary), #555555 (tertiary)
Borders:          #222222 (default), #333333 (emphasized)
Accent primary:   #A3E635 (lime — also used as success)
Accent secondary: #2DD4BF (teal)
Danger:           #EF4444
Warning:          #F59E0B
```

### Project colors (fixed palette)

```
Fruit trees:      #A3E635 (lime)
Bee hives:        #FBBF24 (amber)
Chickens:         #FB923C (orange)
Cannabis:          #2DD4BF (teal)
Vegetable garden: #A78BFA (purple)
Cut flowers:      #F472B6 (pink)
```

### Typography

- Sans: Geist Sans (via `next/font/local` or `geist` package)
- Mono: Geist Mono (for dates, counts, metadata)
- Scale: 11px metadata, 13px body, 14-15px section headers, 20-22px page titles
- Max font size anywhere: 24px
- Use tabular numerals for dates and counts

### Spacing and density

- Row heights: 28-32px for event/item lists
- Card padding: 12-16px
- Sidebar width: 210px
- Borders: 1px solid, never box-shadow
- Transitions: 100-150ms, ease. No spring/bounce.
- Hover: background shift only (#1A1A1A → #222222)

## Data model

Four primitives defined in `/src/lib/types.ts`:

- **Project** — top-level bucket (Fruit trees, Bee hives, etc.)
- **Section** — grouping within a project (e.g., "Tomatoes", "Hive #1", "Coop automation")
- **Item** — atomic unit within a section (specific plant, animal, equipment)
- **Event** — calendar entry tied to a project, with recurrence support

See BRIEF.md for full field definitions.

## Conventions

- All components in `/src/components/` — flat, no nesting
- Lib code in `/src/lib/` — types, storage, calendar utils, colors
- App routes in `/src/app/` — single page app, one route
- Use `"use client"` only where state/effects are needed
- Prefer composition over props drilling — use a simple React context for app state
- Inline forms, never modals. Delete confirmations are inline "are you sure?" text.
- No empty states with illustrations — just a clean "add" button
- No loading spinners — data is local, reads are instant

## Commands

```bash
npm run dev        # local dev server
npm run build      # production build
npm run lint       # eslint
```
