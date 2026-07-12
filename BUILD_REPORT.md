# BUILD REPORT — Phases 0–5

**Date:** 2026-07-11
**Status:** PHASE 5 COMPLETE — ALL CORE PHASES DONE

---

## Phase 0 — Bootstrap

- Next.js 16 + TypeScript strict + Tailwind v4 + Prisma 5 (SQLite)
- Design system: palette, typography (Fraunces/Inter/JetBrains Mono), motion tokens
- Prisma schema (25 models), seed scripts, migration import script
- UI primitives, layout (sidebar + topbar), dashboard page, style guide

---

## Phase 1 — Core CRUD

12 API routes, 8-tab client detail page (Feed, Dati, Strategia, Piano, Allenamento, Misure, Foto, Note), 49 recipes seeded, profile form with all legacy fields, structured meal plan builder.

---

## Phase 2 — Adaptive Nutrition Engine

Weekly Review API + UI: BMR/TDEE, adaptive recalibration, editable macros, approve/edit/reject flow, DietPlan creation.

---

## Phase 3 — WhatsApp (SKIPPED)

Deferred by user. Considering OpenWA (self-hosted) instead of Meta Business API.

---

## Phase 4 — Automation Features

### 4.1 Training Autopilot
- `lib/training-engine.ts`: progressive overload from SessionLog (RPE, reps, pain flag)
- Training tab on client detail with session analysis

### 4.2 Onboarding Autopilot
- `POST /api/onboarding/generate`: DietPlan + WorkoutPlan skeleton
- `generateWeekPlan()` in nutrition-engine for deterministic meal generation

### 4.3 Coach Command Center
- `lib/attention-engine.ts`: 0-100 attention score per client
- Dashboard: stats, "Richiede attenzione" section, sorted client list

---

## Phase 5 — Polish Pass

### 5.1 Dark Mode
- CSS variables for dark theme (already in globals.css)
- `ThemeProvider` with localStorage persistence + system preference detection
- Toggle button in topbar (Sun/Moon icon)

### 5.2 Reduced Motion
- CSS `@media (prefers-reduced-motion: reduce)` collapses all CSS animations
- Framer Motion `MotionConfig reducedMotion="user"` wraps the entire app
- All spring/tween transitions automatically collapse to instant

### 5.3 Command Palette
- `⌘K` / `Ctrl+K` triggers glass-surface command palette
- Client search + "Nuovo cliente" action
- Keyboard navigation (↑↓, Enter, Esc)
- Backdrop blur, spring animation

### 5.4 Drag-to-Reorder
- `Reorder.Group` + `Reorder.Item` from Framer Motion
- Meal items within each plan slot are drag-reorderable
- GripVertical handle, hover state

### 5.5 Empty States
- Feed tab: icon + descriptive text + CTA hint
- Photos tab: icon + explanation
- Training tab: icon + prompt to create workout plan
- Check-in history: icon + explanation
- Dashboard: "Nessun cliente" with prompt

---

## Deviations from spec

| Spec requirement | What was built | Reason |
|---|---|---|
| Supabase (Postgres) | SQLite via Prisma | No Supabase project yet |
| Supabase Auth | Hardcoded `TRAINER_ID` | No Supabase project yet |
| Anthropic API | Deterministic placeholders | User wants free provider |
| WhatsApp (Phase 3) | Skipped | User deferred, evaluating OpenWA |
| shadcn/ui | Custom components | Lighter, already themed |
| Vercel Cron | Not yet implemented | Needs deployment |

---

## What's still TODO (optional enhancements)

- **AI provider**: OpenRouter or similar (needs API key)
- **WhatsApp integration**: OpenWA or Meta API
- **PDF export**: client library (button present)
- **Celebratory moments**: confetti on milestones
- **Page transitions**: AnimatePresence for route changes (partially done)
- **Vercel Cron**: scheduled weekly reports

---

## How to run

```bash
npm run dev
# http://localhost:3000/dashboard              — client list + attention scores
# http://localhost:3000/dashboard/clients/[id]  — client detail (8 tabs)
# http://localhost:3000/dashboard/clients/[id]/review — weekly review
# http://localhost:3000/guide                   — style guide

# ⌘K / Ctrl+K — command palette
# Toggle dark mode — topbar sun/moon icon
```

## Database commands

```bash
npx prisma migrate reset    # Reset DB + reseed
npx prisma db seed          # Seed clients only
npm run db:recipes          # Seed 49 recipes
npm run migrate:import      # Import from legacy JSON
```
