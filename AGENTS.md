# NutriPlan Pro — Full Rebuild Directive

**Read this entire file before writing a single line of code. It is your complete brief.
Do not start coding after skimming the first section — the Design & Motion System and the
Guardrails sections are as binding as the feature list.**

Provenance: this spec is based on a real audit of the current production repository
(`ioccaalberto19-max/nutriplan`), not a generic greenfield assumption. Section 1 reflects what
was actually found in that codebase. Treat it as ground truth for the migration.

---

## 0. Your Role

You are acting as a **Principal Full-Stack Product Engineer and Senior UI/UX Designer** on a
single, high-craft, commercial SaaS product. The end client is a nutritionist/personal trainer
(sole practitioner today, architected for multi-tenant SaaS tomorrow). You are not writing a
prototype or a demo — you are writing the production codebase this business will run on for
years. Every screen you ship must look and feel like it belongs in a product Apple's own design
team would sign off on. There is no "good enough" tier here: mediocre execution on the visual
and motion layer is treated as a bug, exactly like a broken API route would be.

Work in clearly staged **phases** (Section 7). Do not attempt to do everything in one
undifferentiated pass. After each phase, stop, write a short status note, and only continue to
the next phase once the current one is genuinely complete (build passes, no TODOs left silently
unresolved, the phase's "Definition of Done" checklist is fully green). If you are running in an
autonomous/unattended mode, keep going through the phases in order; if a human is watching the
session, pause for a go-ahead after each phase.

---

## 1. Context — What Exists Today (do not skip this)

The current app is a single **293 KB, ~6,200-line `index.html` file** (plus a trivial
`manifest.json` and `sw.js` for offline PWA caching). No framework, no build step, no backend,
no database. Everything — UI, styling, logic — lives in one file with global mutable state.
Persistence is a single JSON blob in `localStorage` (`nutriplan_data_v2`), exported/imported
manually as a `.json` file for backup. It is single-device, single-user, zero-automation,
zero-AI. This is the app real client data lives in *today* — treat the migration path as a first
class requirement, not an afterthought.

**What is genuinely good and must be preserved conceptually (do not reinvent worse versions):**

- **The product workflow**: a client record moves through **Feed → Strategia → Piano**
  (review check-in data/photos/notes → adjust calorie & macro targets → build the actual meal
  plan). Keep this mental model; just automate the parts that are currently manual busywork.
- **The BMR/TDEE calculation**: Mifflin-St Jeor formula, with a `bmrManual`/`tdeeManual` override
  that takes precedence over the formula when the trainer sets it. Port this logic exactly (see
  the reference implementation in Section 6) so historical client data stays consistent.
- **The food taxonomy**: ~19 food categories (lean animal protein, fatty fish, whole grains,
  refined grains, tubers, legumes, etc.) with a category-equivalence map used for food swaps
  (e.g. whole grains ↔ refined grains ↔ tubers are considered interchangeable for substitution
  purposes). This taxonomy is sound — migrate it into the new relational `Recipe`/`FoodCategory`
  model (Section 5) instead of designing a new one from scratch.
- **The visual DNA**: the existing CSS already shows real design intent, not template defaults —
  a warm paper/ink palette, a display serif (Fraunces) paired with a monospace for
  labels/metadata (JetBrains Mono), a restrained terracotta accent. This is a legitimate starting
  point for the new design system (Section 4) — **evolve it, do not discard it for a generic
  shadcn/Tailwind-demo look.**
- The PDF export of a finished plan, and the "snapshot" version history concept (a lightweight
  undo/audit trail of client data over time).

**What must be thrown away completely:**

- The single-file architecture, all global functions/variables, string-templated `innerHTML`
  rendering, zero-types.
- `localStorage` as the persistence layer. This is the single biggest reason the rebuild exists:
  it means no multi-device access, no backup safety beyond manual export, no automation, no
  multi-user, no AI integration possible.
- Meals stored as **free-text strings** parsed at runtime with regex-like matching
  (`extractFoodsFromText`) to recognize foods and compute macros. This is fragile by
  construction — it silently breaks on typos, synonyms, or phrasing the parser doesn't
  recognize, and it cannot be reliably validated against a macro target. In the new system every
  meal item is a structured row referencing a real `Recipe` id and a gram quantity. No
  natural-language meal parsing anywhere in the new app.
- Zero backend, zero automation, zero AI, zero check-in capture from the client side (today,
  100% of "check-in" data is whatever the trainer manually types in after a WhatsApp
  conversation or in-person chat — there is no client-facing input surface at all).

**Non-negotiable migration requirement:** write a one-time import script that reads a
`nutriplan_backup_*.json` export from the current tool (the shape is
`{ clients: [{ id, name, profile: {...}, calc, targets, plan, measurements: [], photos: [],
notes: [] }], snapshots: [] }`) and maps it into the new Postgres schema. This is real production
client data belonging to a paying nutritionist's practice — it must not be lost or require manual
re-entry. Build and test this script in Phase 0.

---

## 2. Mission

Turn this into a **Zero-Friction, AI-powered SaaS platform**. The trainer currently loses most of
his week to manual data entry: reviewing check-ins, adjusting macros by hand, writing meal plans
food-by-food, building training programs, and chasing clients for updates. The system should do
that work *for* him. He should spend his time on the 10% of cases that genuinely need his
judgment, not the 90% that are routine. Every feature you build should be evaluated against one
question: **does this remove a manual step, or does it just move the manual step into a nicer
UI?** Only the former counts as done.

---

## 3. Tech Stack (do not substitute without flagging it explicitly in your build report)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router), TypeScript strict mode | Server Components + Server Actions fit a data-heavy, form-heavy app; strict TS is non-negotiable |
| Styling | Tailwind CSS, custom theme (Section 4) | Utility-first but themed hard — see design guardrails |
| Component primitives | shadcn/ui allowed **for behavior only** (dialogs, popovers, comboboxes) — see guardrail in Section 9 | Accessible, unstyled-enough to fully retheme |
| Animation | **Framer Motion** as the primary engine; native CSS/View Transitions where simpler | Best-in-class React animation primitives, first-class `layoutId` shared-element transitions, spring physics |
| ORM | Prisma | Type-safe, migrations, pairs cleanly with Postgres |
| Database | Supabase (managed Postgres + Auth + Storage + Realtime) | Relational data model is a natural fit (clients → check-ins → plans, all foreign-keyed); RLS gives clean multi-tenant isolation for free; Storage handles check-in/meal photos; Realtime pushes live updates to the trainer's dashboard when a WhatsApp check-in lands. Prefer this over Firebase — Firestore's document model fights against inherently relational data (a client has many check-ins has many... — exactly what Postgres foreign keys are for) |
| AI | Anthropic API (`@anthropic-ai/sdk`), model `claude-sonnet-5` | Structured outputs (strict tool use) for guaranteed-valid JSON, native vision for meal-photo logging, good cost/latency balance for high request volume |
| Messaging | Meta WhatsApp Business Cloud API (official, direct — not a paid BSP) | Free API access, billed per 24h conversation window, first-class webhook model |
| Validation | Zod everywhere at trust boundaries (API routes, LLM tool outputs, forms) | Never trust unvalidated input, especially LLM output |
| Hosting | Vercel | Native Next.js fit, Cron for scheduled jobs |
| Testing | Vitest for units (pure calculation functions, validators), Playwright for critical e2e flows (create client → generate plan → approve) | |

**Supabase connection detail that matters:** use the pooled connection string (port 6543,
PgBouncer) for the app runtime (`DATABASE_URL`) and the direct connection (port 5432) for Prisma
migrations (`DIRECT_URL`). Skipping this is the #1 cause of connection-pool exhaustion for
Prisma-on-serverless — do not skip it.

---

## 4. Design System & Motion Language — READ THIS TWICE

This is the section most likely to be under-executed by default. "Make it beautiful" is not a
spec an agent can reliably hit without concrete numbers — so here are the numbers. Treat every
value below as a real design token, not a suggestion.

### 4.1 The anti-pattern to actively avoid

Do **not** produce the generic "AI-generated SaaS" look that saturates every Tailwind/shadcn demo
right now: indigo-to-violet gradients, `Inter` everywhere, plain white cards with a soft gray
shadow, rounded-xl on everything at the same radius, a hero section with a gradient blob. If any
screen you produce could be mistaken for a generic SaaS template, you have failed this brief,
even if the feature underneath is functionally correct.

### 4.2 Palette — evolve the existing tokens, don't replace them

```css
:root {
  /* Base, carried over from the existing app — already good, keep exactly */
  --ink: #1a1915;         /* primary text, near-black warm charcoal */
  --paper: #f4f1ea;       /* base background, warm cream */
  --paper-2: #ebe6da;     /* secondary surface */
  --paper-3: #e0dace;     /* tertiary surface / borders */
  --accent: #c84b31;      /* primary CTA / highlight — terracotta, use sparingly */
  --olive: #5c6b3a;       /* secondary accent — success states, secondary data series */
  --gold: #b8862f;        /* tertiary accent — badges, streaks, highlights */
  --danger: #8b2e1f;
  --success: #3a6b3a;

  /* New: elevation & glass, for the Apple-style depth this brief demands */
  --surface-glass: color-mix(in srgb, var(--paper) 72%, transparent);
  --shadow-color: 26 25 21; /* rgb of --ink, used with low alpha for warm-tinted shadows */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-full: 999px;
}

[data-theme="dark"] {
  --ink: #f4f1ea;
  --paper: #14130f;
  --paper-2: #1d1c16;
  --paper-3: #26241c;
  --accent: #e0714f;   /* lifted terracotta for dark backgrounds */
  --surface-glass: color-mix(in srgb, var(--paper) 60%, transparent);
}
```

Never use cool gray (`#e5e7eb`-style neutrals) anywhere — every neutral in this app is warm,
derived from `--ink`/`--paper`. Shadows are tinted warm (`rgba(26,25,21,0.08)`), never
cool-gray Material-style shadows.

### 4.3 Typography — a three-family system, each with a strict job

| Family | Role | Notes |
|---|---|---|
| **Fraunces** (variable, already in use) | Display: page titles, client names, hero numbers (e.g. current weight, kcal target), section headers | Use the high-contrast/high-optical-size axis for large sizes; italic for editorial accents (as the current app already does for the empty-state ornament) |
| **A clean humanist sans** — General Sans or Inter, pick one and use it everywhere for this role | Body copy, form labels, buttons, navigation, table content | This is new — the current app has no body sans and leans on the serif/mono pair even for dense UI, which hurts legibility in tables and forms. Fix that here. |
| **JetBrains Mono** (already in use) | Metadata, timestamps, macro numbers in data-dense contexts (a macro readout like `P 42 · C 180 · F 60`), category tags | Always uppercase + letter-spaced for labels, exactly as the current app already does — keep that convention |

Define a type scale (rem, 1.25 ratio is fine) and use it consistently — no ad hoc font-sizes.

### 4.4 Spacing, radius, elevation

- 4px base unit; use the scale 4/8/12/16/24/32/48/64.
- Radius scale from the tokens above (`--radius-sm/md/lg/full`) — pick deliberately per
  component size, never one blanket radius for every element.
- Elevation via warm-tinted soft shadows *and* the `--surface-glass` token with
  `backdrop-filter: blur(20px)` for floating panels (command palette, modals, the mobile nav bar)
  — this is where the "Apple" quality comes from: translucent, layered, depth-through-blur, not
  flat cards on flat backgrounds.

### 4.5 Motion tokens (define once in `lib/motion.ts`, import everywhere — no ad hoc durations)

```ts
export const duration = { fast: 0.15, base: 0.25, slow: 0.4, deliberate: 0.6 };
export const easeOutApple = [0.22, 1, 0.36, 1] as const; // the iOS-like decelerate curve
export const springSnappy = { type: "spring", stiffness: 400, damping: 32 } as const;
export const springSoft = { type: "spring", stiffness: 180, damping: 22 } as const;
```

### 4.6 Signature interactions — required, not optional

Implement all of the following. These are the difference between "a Tailwind app" and "a
product with real craft":

1. **Shared-element transitions**: tapping a client card in the list expands it into the client
   detail view via Framer Motion `layoutId` — never a hard cut or a plain fade between list and
   detail.
2. **Staggered list entrances**: any list (clients, check-ins, meal items) animates children in
   with a ~40ms stagger, not all-at-once.
3. **Live check-in arrival**: when a WhatsApp check-in lands via Supabase Realtime while the
   trainer has the dashboard open, the affected client card gets a soft pulse/glow ring
   (accent-colored, ~1.2s, ease out) — never a jarring re-render or a toast that steals focus.
4. **Command palette** (`⌘K` / `Ctrl+K`): global quick-actions and search, Linear/Raycast-style,
   rendered on the glass surface token. This is a genuine "power tool" touch worth the build time.
5. **Macro rings/gauges**: animate fill on mount and on every data change with a spring, never a
   linear tween — this is the single most-looked-at data visualization in the app (daily
   kcal/macro progress) and deserves the most polish.
6. **Skeleton loading**: every data-dependent view gets a shimmer skeleton matching its final
   layout. No bare spinners for content areas.
7. **Page/route transitions**: `AnimatePresence mode="wait"` (or the View Transitions API where
   it fits better) for route changes — never an abrupt unstyled swap.
8. **Drag-to-reorder** meal items within a plan (`Reorder` from Framer Motion).
9. **Toasts**: slide in from top-right with `springSnappy`, auto-dismiss with a visible shrinking
   progress bar.
10. **Empty states are designed, not defaulted**: a simple line-art illustration in the accent
    palette + one clear call to action. Never bare "No data" text — this includes the very first
    screen a trainer sees before creating a client.
11. **Restrained celebratory moments** on real milestones (client hits a goal weight, a plan is
    finalized and sent) — small, brand-colored, tasteful. Not generic multicolor confetti.
12. **Respect `prefers-reduced-motion`**: every animation above collapses to an instant/opacity-only
    transition when the user has this preference set. This is a hard requirement, not a nice-to-have.

Build the design system and these primitives in Phase 0/1 *before* building individual features
on top of them, so every subsequent screen inherits this quality by construction rather than
needing a retrofit.

---

## 5. Data Model

Use this Prisma schema **exactly** as the starting point — it already reflects the entities this
app needs (trainers, clients, check-ins, meal logs, diet plans, workout plans, the food/recipe
catalog, WhatsApp conversation state, idempotency tracking). Extend it if a feature genuinely
needs a new field, but do not redesign the core shape from scratch.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================================
// TENANCY
// ============================================================

model Trainer {
  id           String   @id @default(uuid())
  email        String   @unique
  fullName     String
  businessName String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  clients   Client[]
  exercises Exercise[]
  recipes   Recipe[]

  @@map("trainers")
}

// ============================================================
// CLIENTI
// ============================================================

enum Sex { M F }
enum DietType { ONNIVORO PESCETARIANO VEGETARIANO VEGANO }
enum Goal { CUT MAINTAIN BULK RECOMP }
enum ClientStatus { ACTIVE PAUSED CHURNED }

model Client {
  id              String   @id @default(uuid())
  trainerId       String
  trainer         Trainer  @relation(fields: [trainerId], references: [id], onDelete: Cascade)

  fullName        String
  phoneNumberE164 String   @unique // WhatsApp channel: primary client identifier
  email           String?
  status          ClientStatus @default(ACTIVE)

  sex             Sex?
  age             Int?
  heightCm        Float?
  startWeightKg   Float?
  exclusions      String[]
  diet            DietType @default(ONNIVORO)
  activityFactor  Float    @default(1.55)
  goal            Goal     @default(MAINTAIN)
  trainingDaysWk  Int      @default(3)
  waterTargetL    Float    @default(2)
  bmrManualKcal   Float?
  tdeeManualKcal  Float?

  medicalNotes    String?  // sensitive health data: encrypt at rest (pgcrypto or app-layer)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  checkIns          CheckIn[]
  mealLogs          MealLog[]
  dietPlans         DietPlan[]
  workoutPlans      WorkoutPlan[]
  consents          ConsentRecord[]
  conversationState ConversationState?

  @@index([trainerId, status])
  @@map("clients")
}

model ConsentRecord {
  id        String      @id @default(uuid())
  clientId  String
  client    Client      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  type      ConsentType
  grantedAt DateTime    @default(now())
  revokedAt DateTime?

  @@map("consent_records")
}

enum ConsentType { HEALTH_DATA_PROCESSING WHATSAPP_AUTOMATION MARKETING }

// ============================================================
// CHECK-IN
// ============================================================

enum CheckInSource { WHATSAPP TELEGRAM WEB MANUAL }

model CheckIn {
  id           String   @id @default(uuid())
  clientId     String
  client       Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  weightKg     Float?
  sleepHours   Float?
  stressLevel  Int?
  energyLevel  Int?
  adherencePct Int?
  notes        String?
  photoUrls    String[]

  source    CheckInSource @default(WHATSAPP)
  createdAt DateTime      @default(now())

  @@index([clientId, createdAt])
  @@map("check_ins")
}

// ============================================================
// MEAL LOGGING (vision AI)
// ============================================================

enum MealLogSource { PHOTO MANUAL VOICE }

model MealLog {
  id                String   @id @default(uuid())
  clientId          String
  client            Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  imageUrl          String?
  source            MealLogSource @default(PHOTO)

  estimatedKcal     Float?
  estimatedProteinG Float?
  estimatedCarbG    Float?
  estimatedFatG     Float?
  confidence        Float?
  rawVisionOutput   Json?
  correctedByUser   Boolean  @default(false)

  loggedAt DateTime @default(now())

  @@index([clientId, loggedAt])
  @@map("meal_logs")
}

// ============================================================
// WHATSAPP BOT STATE
// ============================================================

model ConversationState {
  clientId    String   @id
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  flow        String?
  step        String?
  contextJson Json?
  updatedAt   DateTime @updatedAt

  @@map("conversation_states")
}

model ProcessedWebhookEvent {
  wamid       String   @id // idempotency key
  processedAt DateTime @default(now())

  @@map("processed_webhook_events")
}

// ============================================================
// FOOD / RECIPE CATALOG (RAG grounding for the LLM)
// ============================================================

enum FoodCategory {
  PROT_ANIMAL_LEAN FISH_LEAN FISH_FAT EGGS DAIRY_PROTEIN CHEESE PROT_VEG
  LEGUMES GRAINS_WHOLE GRAINS_REFINED TUBERS VEG FRUIT NUTS FATS
  PLANT_MILK SNACKS SUPPLEMENTS CONDIMENTS
}

model Recipe {
  id             String       @id @default(uuid())
  trainerId      String?      // null = shared global library
  trainer        Trainer?     @relation(fields: [trainerId], references: [id], onDelete: Cascade)

  name           String
  category       FoodCategory
  kcalPer100g    Float
  proteinPer100g Float
  carbPer100g    Float
  fatPer100g     Float
  dietTags       DietType[]
  allergens      String[]
  instructions   String?

  dietPlanMeals DietPlanMeal[]

  @@index([category])
  @@map("recipes")
}

// ============================================================
// DIET PLANS
// ============================================================

enum PlanStatus { DRAFT ACTIVE ARCHIVED }
enum GeneratorSource { AI TRAINER HYBRID }
enum MealSlot { COLAZIONE SPUNTINO_MATTINA PRANZO SPUNTINO_POMERIGGIO CENA }

model DietPlan {
  id             String   @id @default(uuid())
  clientId       String
  client         Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  weekStart      DateTime
  targetKcal     Int
  targetProteinG Int
  targetCarbG    Int
  targetFatG     Int

  status              PlanStatus      @default(DRAFT)
  generatedBy         GeneratorSource @default(AI)
  approvedByTrainerAt DateTime?

  meals     DietPlanMeal[]
  createdAt DateTime       @default(now())

  @@index([clientId, weekStart])
  @@map("diet_plans")
}

model DietPlanMeal {
  id          String   @id @default(uuid())
  dietPlanId  String
  dietPlan    DietPlan @relation(fields: [dietPlanId], references: [id], onDelete: Cascade)

  dayOfWeek   Int
  slot        MealSlot
  recipeId    String?
  recipe      Recipe?  @relation(fields: [recipeId], references: [id])
  customLabel String?
  grams       Float?
  kcal        Int
  proteinG    Float
  carbG       Float
  fatG        Float

  @@index([dietPlanId, dayOfWeek])
  @@map("diet_plan_meals")
}

// ============================================================
// WORKOUTS
// ============================================================

model Exercise {
  id                String   @id @default(uuid())
  trainerId         String?
  trainer           Trainer? @relation(fields: [trainerId], references: [id], onDelete: Cascade)

  name              String
  muscleGroup       String
  equipment         String?
  videoUrl          String?
  substitutionGroup String?

  sessionExercises WorkoutSessionExercise[]

  @@map("exercises")
}

model WorkoutPlan {
  id        String   @id @default(uuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  weekStart           DateTime
  status              PlanStatus      @default(DRAFT)
  generatedBy         GeneratorSource @default(AI)
  approvedByTrainerAt DateTime?

  sessions  WorkoutSession[]
  createdAt DateTime          @default(now())

  @@index([clientId, weekStart])
  @@map("workout_plans")
}

model WorkoutSession {
  id            String      @id @default(uuid())
  workoutPlanId String
  workoutPlan   WorkoutPlan @relation(fields: [workoutPlanId], references: [id], onDelete: Cascade)

  dayOfWeek Int
  name      String

  exercises WorkoutSessionExercise[]
  logs      SessionLog[]

  @@map("workout_sessions")
}

model WorkoutSessionExercise {
  id               String         @id @default(uuid())
  workoutSessionId String
  workoutSession   WorkoutSession @relation(fields: [workoutSessionId], references: [id], onDelete: Cascade)
  exerciseId       String
  exercise         Exercise       @relation(fields: [exerciseId], references: [id])

  targetSets    Int
  targetRepsMin Int
  targetRepsMax Int
  targetRpe     Float?
  orderIndex    Int    @default(0)

  @@index([workoutSessionId])
  @@map("workout_session_exercises")
}

model SessionLog {
  id               String         @id @default(uuid())
  workoutSessionId String
  workoutSession   WorkoutSession @relation(fields: [workoutSessionId], references: [id], onDelete: Cascade)
  exerciseId       String

  setNumber Int
  reps      Int
  weightKg  Float
  rpe       Float?
  painFlag  Boolean @default(false) // true => must escalate to trainer, never auto-handled

  loggedAt DateTime @default(now())

  @@index([workoutSessionId, exerciseId])
  @@map("session_logs")
}
```

Note on scale: the food catalog is filtered with a plain indexed SQL query
(`WHERE category/dietTags/allergens...`), not a vector store. At this data volume (hundreds to
low thousands of foods) a vector DB is unnecessary complexity. Only revisit this if the catalog
grows by orders of magnitude.

---

## 6. Core Automation Features

Build these in the phase order given in Section 7. For Feature 1, use the reference
implementation below as your actual starting point — it encodes a design principle you must
carry through every AI-touching feature in this app:

> **The LLM is never the source of truth on numbers.** Deterministic code computes BMR/TDEE and
> validates any macro totals the model proposes. The model is only ever used for the *creative*
> part (matching real catalog items to a target, writing a coaching note, interpreting a photo) —
> and every one of its structured outputs gets numerically re-verified in code before it's shown
> to anyone. If a result is outside tolerance, repair it mathematically (e.g. scale quantities
> proportionally); do not re-prompt in a loop and do not trust the model's own arithmetic.

### 6.1 Feature — Adaptive Nutrition Engine (reference implementation, adapt into `lib/nutrition-engine.ts`)

```ts
/**
 * lib/nutrition-engine.ts
 * Deterministic BMR/TDEE core + weekly adaptive recalibration + LLM-assisted,
 * numerically-validated meal generation. See the design principle above — it governs this file.
 */

import type { PrismaClient, Recipe, CheckIn, DietType } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic();
const GENERATION_MODEL = "claude-sonnet-5";

// --- 1) Deterministic BMR / TDEE --------------------------------------------------

export interface ProfileForCalc {
  sex: "M" | "F" | null;
  age: number | null;
  heightCm: number | null;
  activityFactor: number;
  goal: "CUT" | "MAINTAIN" | "BULK" | "RECOMP";
  bmrManualKcal: number | null;
  tdeeManualKcal: number | null;
}

export function calcBMR(p: ProfileForCalc, currentWeightKg: number): number {
  if (p.bmrManualKcal != null) return p.bmrManualKcal;
  if (!p.age || !p.heightCm || !p.sex) {
    throw new Error("Missing age/height/sex: cannot compute BMR.");
  }
  const base = 10 * currentWeightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === "M" ? base + 5 : base - 161;
}

export function calcTDEE(p: ProfileForCalc, currentWeightKg: number) {
  const bmrFromFormula = p.bmrManualKcal == null;
  const bmrKcal = calcBMR(p, currentWeightKg);
  if (p.tdeeManualKcal != null) {
    return { bmrKcal, tdeeKcal: p.tdeeManualKcal, bmrFromFormula, tdeeFromFormula: false };
  }
  return { bmrKcal, tdeeKcal: bmrKcal * p.activityFactor, bmrFromFormula, tdeeFromFormula: true };
}

// --- 2) Weekly adaptive recalibration ---------------------------------------------

const SAFETY_FLOOR_KCAL: Record<"M" | "F", number> = { M: 1500, F: 1200 };
const MAX_AUTONOMOUS_ADJUST_PCT = 0.08;

export function computeAdaptiveRecalibration(
  client: ProfileForCalc & { sex: "M" | "F" },
  previousTargetKcal: number,
  recentCheckIns: Pick<CheckIn, "weightKg" | "createdAt">[],
) {
  const weighed = recentCheckIns
    .filter((c): c is { weightKg: number; createdAt: Date } => c.weightKg != null)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (weighed.length < 2) {
    return {
      previousTargetKcal, suggestedTargetKcal: previousTargetKcal, deltaPct: 0,
      requiresTrainerReview: false,
      reason: "Not enough weigh-ins yet (need at least 2) for a reliable recalibration.",
    };
  }

  const first = weighed[0];
  const last = weighed[weighed.length - 1];
  const weeks = Math.max((last.createdAt.getTime() - first.createdAt.getTime()) / (7 * 86_400_000), 0.5);
  const actualKgPerWeek = (last.weightKg - first.weightKg) / weeks;
  const expectedKgPerWeek = client.goal === "CUT" ? -0.5 : client.goal === "BULK" ? 0.25 : 0;
  const driftKgPerWeek = actualKgPerWeek - expectedKgPerWeek;
  const kcalDriftPerDay = (driftKgPerWeek * 7700) / 7;

  const rawAdjust = -kcalDriftPerDay * 0.5; // half-drift correction to avoid weekly whiplash
  const maxAdjust = previousTargetKcal * MAX_AUTONOMOUS_ADJUST_PCT;
  const clampedAdjust = Math.max(-maxAdjust, Math.min(maxAdjust, rawAdjust));

  let suggested = Math.round(previousTargetKcal + clampedAdjust);
  const floor = SAFETY_FLOOR_KCAL[client.sex];
  let requiresTrainerReview = Math.abs(rawAdjust) > maxAdjust;

  if (suggested < floor) { suggested = floor; requiresTrainerReview = true; }

  return {
    previousTargetKcal, suggestedTargetKcal: suggested,
    deltaPct: (suggested - previousTargetKcal) / previousTargetKcal,
    requiresTrainerReview,
    reason: requiresTrainerReview
      ? "Adjustment exceeds the autonomous threshold or hit the safety floor: needs trainer review."
      : "Within autonomous bounds, applied automatically.",
  };
}

// --- 3) LLM-assisted meal generation, numerically validated -----------------------

const MacroTargetSchema = z.object({ kcal: z.number(), proteinG: z.number(), carbG: z.number(), fatG: z.number() });
export type MacroTarget = z.infer<typeof MacroTargetSchema>;
const MACRO_TOLERANCE_PCT = 0.05;

export async function generateMeal(
  prisma: PrismaClient,
  params: { trainerId: string; diet: DietType; exclusions: string[]; target: MacroTarget; mealLabel: string },
) {
  const candidates = await prisma.recipe.findMany({
    where: {
      OR: [{ trainerId: params.trainerId }, { trainerId: null }],
      dietTags: { has: params.diet },
      NOT: { allergens: { hasSome: params.exclusions } },
    },
    take: 200,
  });
  if (candidates.length === 0) throw new Error("No compatible foods found — check catalog diet/allergen tags.");

  const catalog = candidates.map((r) => ({
    id: r.id, name: r.name, category: r.category,
    kcalPer100g: r.kcalPer100g, proteinPer100g: r.proteinPer100g, carbPer100g: r.carbPer100g, fatPer100g: r.fatPer100g,
  }));

  const response = await anthropic.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 1024,
    system:
      "You compose meals for a nutritionist's app. Use ONLY foods from the given catalog (by id). " +
      "Never invent foods, never estimate macros yourself — quantities in grams are the only " +
      "thing you decide; per-100g nutrition values are already given and will be re-summed by " +
      "external code, so you do not need to compute the final totals.",
    messages: [{
      role: "user",
      content: `Compose "${params.mealLabel}" for a target of ${params.target.kcal} kcal, ` +
        `${params.target.proteinG}g protein, ${params.target.carbG}g carbs, ${params.target.fatG}g fat, ` +
        `using 2-4 foods from this catalog:\n\n${JSON.stringify(catalog)}`,
    }],
    tools: [{
      name: "propose_meal",
      description: "Propose the meal composition using catalog foods.",
      input_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: { recipeId: { type: "string" }, grams: { type: "number" } },
              required: ["recipeId", "grams"],
            },
          },
          rationale: { type: "string" },
        },
        required: ["items", "rationale"],
      },
      strict: true, // grammar-constrained: guarantees schema-valid output
    }],
    tool_choice: { type: "tool", name: "propose_meal" },
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("Model did not return the expected tool_use call.");

  const proposal = z.object({
    items: z.array(z.object({ recipeId: z.string(), grams: z.number().positive() })).min(1),
    rationale: z.string(),
  }).parse(toolUse.input);

  // Never trust the model's arithmetic: re-sum from real catalog values and repair if needed.
  const byId = new Map(candidates.map((r) => [r.id, r]));
  const resolved = proposal.items.map((item) => {
    const recipe = byId.get(item.recipeId);
    if (!recipe) throw new Error(`recipeId "${item.recipeId}" not in supplied catalog: likely hallucination.`);
    return { recipe, grams: item.grams };
  });

  const sumKcal = (items: typeof resolved) => items.reduce((acc, r) => acc + (r.recipe.kcalPer100g * r.grams) / 100, 0);
  let totalKcal = sumKcal(resolved);
  let finalItems = resolved;

  if (Math.abs(totalKcal - params.target.kcal) / params.target.kcal > MACRO_TOLERANCE_PCT) {
    const scale = params.target.kcal / totalKcal; // proportional repair, deterministic & reproducible
    finalItems = resolved.map((r) => ({ recipe: r.recipe, grams: r.grams * scale }));
    totalKcal = sumKcal(finalItems);
  }

  return {
    items: finalItems.map((r) => ({ recipeId: r.recipe.id, recipeName: r.recipe.name, grams: Math.round(r.grams) })),
    totalKcal,
    withinTolerance: Math.abs(totalKcal - params.target.kcal) / params.target.kcal <= MACRO_TOLERANCE_PCT,
  };
}
```

Build a "Weekly Review" screen around this: the trainer sees the proposed recalibration and the
AI-drafted meals side by side with the previous week, and approves/edits/rejects. **Never
silently auto-apply a recalibration or a new plan without this screen** — this is a safety
requirement, not just a UX preference (see Section 9).

### 6.2 Feature — Training Autopilot (autoregulation)

Progressive overload driven by logged RPE/RIR: if a client consistently logs RIR ≤1 at the top of
the prescribed rep range, auto-increase load next session by a small increment; if reps are
missed or RIR is consistently high, hold or deload. Use `Exercise.substitutionGroup` to
auto-substitute equipment-incompatible or disliked exercises, with an LLM only for the
personalized coaching note attached to the substitution — never for the load/volume math itself.
**Any `SessionLog.painFlag = true` must hard-escalate to the trainer and must never be
auto-resolved by substitution logic.** This is a safety boundary, not a UX choice.

### 6.3 Feature — WhatsApp Zero-Friction Check-in + Vision Meal Logging

Build `app/api/whatsapp/webhook/route.ts` against the official Meta WhatsApp Business Cloud API:

- `GET`: webhook verification handshake — validate `hub.verify_token` against an env secret,
  echo back `hub.challenge`.
- `POST`: validate the `X-Hub-Signature-256` header (HMAC-SHA256 of the raw body using the Meta
  App Secret, timing-safe compare) before doing anything else.
- Meta retries webhook delivery for up to 7 days on any non-200 response, which **will** produce
  duplicate deliveries — check `ProcessedWebhookEvent` (keyed on the message's `wamid`) before
  processing anything, insert after.
- Text messages: route through a small conversation-state machine (`ConversationState.flow` /
  `.step` / `.contextJson`) driving the weekly check-in Q&A (weight → sleep → stress/energy →
  adherence/notes) and writing a `CheckIn` row on completion, which then triggers 6.1's
  recalibration.
- Image messages: WhatsApp gives you a media `id`, not the binary — `GET
  /{media-id}` for a temporary URL, download it, upload to Supabase Storage, then call Claude
  vision with a `confidence` field in the structured output. Below a confidence threshold, reply
  with a WhatsApp interactive quick-reply message asking a clarifying question instead of logging
  a guess. Confidence-gated human/user review is the single highest-leverage reliability pattern
  for production vision pipelines — do not skip it.
- Use a **System User permanent access token** (not the 24h default token) for outbound sends.
- Send outbound messages via `POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
  (verify current Graph API version at build time — Meta revs this periodically).
- Keep this route's synchronous work minimal so the 200 response is fast; if a step is slow
  (vision call), either await it inline (acceptable at moderate volume — Meta's retry window is
  generous) or hand off via a queue/Vercel Cron worker once volume makes that necessary. Don't
  over-engineer this on day one; do design the function so swapping in a queue later is a
  contained change (one function boundary, not a rewrite).

### 6.4 Feature — Onboarding Autopilot

New client intake (web form for the structured anamnesis — medical history, injuries, detailed
preferences — plus WhatsApp for the ongoing habitual check-ins) triggers, on submit: the
deterministic TDEE calc (6.1) and an AI-drafted first-week diet plan + training program skeleton,
both created as `status: DRAFT, generatedBy: AI`. The trainer reviews and approves
(`approvedByTrainerAt`) before anything reaches the client. This turns "blank page for every new
client" into "review and tweak."

### 6.5 Feature — Coach Command Center (reporting + churn signal)

A scheduled weekly job (Vercel Cron) that, per active client: sends an auto-generated,
on-brand progress report over WhatsApp (weight trend, adherence, before/after photo pair if
available) with zero manual effort from the trainer, and computes an **application-layer** (not
stored/stale) "needs attention" score from signals like missed check-in streaks, declining
adherence, and a weight trend that has stalled despite reported adherence. Surface this as a
sorted list on the dashboard so the trainer works by exception instead of reviewing every client
every week — this is the feature that actually gives him his time back.

---

## 7. Execution Plan — Build in This Order

**Phase 0 — Bootstrap**
Next.js + TS strict + Tailwind (with the Section 4 theme) project init. Prisma + Supabase wired
(pooled + direct URLs). Supabase Auth scaffolded (single trainer today, `trainerId`-scoped
everywhere so multi-tenant is a config change later, not a rewrite). Build and test the JSON
import script for the legacy `nutriplan_backup_*.json` export. Build a small "kitchen sink" /
style-guide page exercising every design token and every Section 4.6 interaction primitive.
*Definition of done: `npm run dev` runs, migrations applied, one real trainer + imported client
visible, style guide page renders every motion primitive correctly, reduced-motion fallback
verified.*

**Phase 1 — Core CRUD, rebuilt on the new foundation**
Client list/detail with the shared-element transition. Profile form mirroring the legacy fields
exactly. TDEE/BMR calc + manual override UI. Structured meal-plan builder (real `Recipe` rows +
gram quantities, category-based substitution — no free-text meals anywhere). PDF export
preserved. *Definition of done: everything the trainer does today in the old tool is possible
here, faster, on the new design system.*

**Phase 2 — Adaptive Nutrition Engine**
Wire up `lib/nutrition-engine.ts` (6.1) and the Weekly Review approval screen end-to-end.
*Definition of done: a check-in produces a reviewable recalibration + AI meal draft.*

**Phase 3 — WhatsApp Check-in + Vision Meal Logging**
Build 6.3 end-to-end against a real Meta test number. *Definition of done: a WhatsApp message
from a test device produces a `CheckIn` or `MealLog` row and a confirmation reply, with
idempotency verified by sending the same webhook payload twice.*

**Phase 4 — Training Autopilot, Onboarding Autopilot, Coach Command Center**
Build 6.2, 6.4, 6.5. *Definition of done: each feature's Section 6 description is fully
implemented, including the safety escalation behaviors.*

**Phase 5 — Dedicated polish pass**
A pass whose only job is motion, empty/loading/error states, dark mode, and accessibility across
every screen built in Phases 1–4 — do not treat this as optional just because features are
"done." *Definition of done: every Section 4.6 interaction is present on every screen where it
applies, `prefers-reduced-motion` verified across the whole app, dark mode verified across the
whole app.*

---

## 8. Guardrails — Do Not

- Do not silently auto-apply an AI-generated recalibration, diet plan, or training plan without
  the trainer approval step described in Sections 6.1/6.4. This is a safety requirement: these
  are health/fitness recommendations for real people.
- Do not let a generated diet target fall below the safety floor (Section 6.1) without flagging
  for trainer review.
- Do not auto-resolve a logged pain flag (Section 6.2) via substitution — always escalate.
- Do not use `localStorage`/`sessionStorage` as a persistence layer anywhere — that's the exact
  failure mode this rebuild exists to fix.
- Do not reintroduce free-text meal parsing anywhere.
- Do not use shadcn/ui components with their default visual theme — retheme every primitive
  through the Section 4 tokens; if a component still visually reads as "default shadcn," it's not
  done.
- Do not fabricate believable-looking demo data that could be mistaken for real client data —
  clearly label any seed data as such.
- Do not skip error handling or swallow errors silently, especially around the WhatsApp webhook
  and the Anthropic API calls (both can and will fail in production — handle retries and
  visible failure states).
- Do not invent a new library or swap a stack choice from Section 3 without calling it out
  explicitly, with reasoning, in your build report.

---

## 9. How to Report Back

Produce a `BUILD_REPORT.md` at the end of each phase (or at the end, if running unattended
through all phases) covering: what was built, any deviations from this spec and why, what's
stubbed or TODO, and any open questions that need the trainer's/developer's judgment rather than
an autonomous decision. Optimize for someone reviewing this efficiently, not for length.