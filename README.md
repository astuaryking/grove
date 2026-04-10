# Homestead Manager

Personal homestead operations dashboard. Dark, dense, fast.

## Quick start

```bash
# 1. Create the Next.js project
npx create-next-app@latest homestead --typescript --tailwind --app --src-dir --eslint

# 2. cd in and install deps
cd homestead
npm install geist nanoid lucide-react

# 3. Init shadcn/ui (select: dark theme, zinc base color, src/components/ui)
npx shadcn@latest init

# 4. Copy CLAUDE.md and BRIEF.md into the project root
# 5. Open with Claude Code:
claude

# 6. Tell Claude Code:
#    "Read CLAUDE.md and BRIEF.md, then build Phase 1 and Phase 2 from the roadmap."
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time links to your Vercel account)
vercel

# Production deploy
vercel --prod
```

Or connect the GitHub repo to Vercel for auto-deploy on push.

## Project structure

```
/src
  /app
    layout.tsx          # root layout with Geist font + dark bg
    page.tsx            # main app shell
  /components
    Sidebar.tsx
    ProjectDetail.tsx
    SectionCard.tsx
    ItemRow.tsx
    EventRow.tsx
    AddEventForm.tsx
    AddSectionForm.tsx
    AddItemForm.tsx
    CalendarView.tsx
    TodayView.tsx
    MetricCard.tsx
  /lib
    types.ts            # Project, Section, Item, Event interfaces
    storage.ts          # localStorage load/save with migration support
    calendar.ts         # recurrence calculation, date utils
    colors.ts           # project color palette
    seed.ts             # default project data
    context.tsx         # app state context + reducer
  /components/ui        # shadcn/ui components
```
