/**
 * lib/nutrition-engine.ts
 * Deterministic BMR/TDEE core + weekly adaptive recalibration + meal plan generation.
 * Section 6.1 of AGENTS.md — the LLM is never the source of truth on numbers.
 */

import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

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
  return p.sex === "M" ? Math.round(base + 5) : Math.round(base - 161);
}

export function calcTDEE(p: ProfileForCalc, currentWeightKg: number) {
  const bmrFromFormula = p.bmrManualKcal == null;
  const bmrKcal = calcBMR(p, currentWeightKg);
  if (p.tdeeManualKcal != null) {
    return {
      bmrKcal,
      tdeeKcal: p.tdeeManualKcal,
      bmrFromFormula,
      tdeeFromFormula: false,
    };
  }
  return {
    bmrKcal,
    tdeeKcal: Math.round(bmrKcal * p.activityFactor),
    bmrFromFormula,
    tdeeFromFormula: true,
  };
}

// --- 2) Weekly adaptive recalibration ---------------------------------------------

const SAFETY_FLOOR_KCAL: Record<"M" | "F", number> = { M: 1500, F: 1200 };
const MAX_AUTONOMOUS_ADJUST_PCT = 0.08;

export interface RecalibrationResult {
  previousTargetKcal: number;
  suggestedTargetKcal: number;
  deltaPct: number;
  requiresTrainerReview: boolean;
  reason: string;
}

export function computeAdaptiveRecalibration(
  client: ProfileForCalc & { sex: "M" | "F" },
  previousTargetKcal: number,
  recentCheckIns: { weightKg: number | null; createdAt: Date }[],
): RecalibrationResult {
  const weighed = recentCheckIns
    .filter((c): c is { weightKg: number; createdAt: Date } => c.weightKg != null)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (weighed.length < 2) {
    return {
      previousTargetKcal,
      suggestedTargetKcal: previousTargetKcal,
      deltaPct: 0,
      requiresTrainerReview: false,
      reason:
        "Not enough weigh-ins yet (need at least 2) for a reliable recalibration.",
    };
  }

  const first = weighed[0];
  const last = weighed[weighed.length - 1];
  const weeks = Math.max(
    (last.createdAt.getTime() - first.createdAt.getTime()) / (7 * 86_400_000),
    0.5,
  );
  const actualKgPerWeek = (last.weightKg - first.weightKg) / weeks;
  const expectedKgPerWeek =
    client.goal === "CUT" ? -0.5 : client.goal === "BULK" ? 0.25 : 0;
  const driftKgPerWeek = actualKgPerWeek - expectedKgPerWeek;
  const kcalDriftPerDay = (driftKgPerWeek * 7700) / 7;

  const rawAdjust = -kcalDriftPerDay * 0.5;
  const maxAdjust = previousTargetKcal * MAX_AUTONOMOUS_ADJUST_PCT;
  const clampedAdjust = Math.max(-maxAdjust, Math.min(maxAdjust, rawAdjust));

  let suggested = Math.round(previousTargetKcal + clampedAdjust);
  const floor = SAFETY_FLOOR_KCAL[client.sex];
  let requiresTrainerReview = Math.abs(rawAdjust) > maxAdjust;

  if (suggested < floor) {
    suggested = floor;
    requiresTrainerReview = true;
  }

  return {
    previousTargetKcal,
    suggestedTargetKcal: suggested,
    deltaPct: (suggested - previousTargetKcal) / previousTargetKcal,
    requiresTrainerReview,
    reason: requiresTrainerReview
      ? "Adjustment exceeds the autonomous threshold or hit the safety floor: needs trainer review."
      : "Within autonomous bounds, applied automatically.",
  };
}

// --- 3) Macro targets from kcal + goal -------------------------------------------

export function computeMacroTargets(
  goal: "CUT" | "MAINTAIN" | "BULK" | "RECOMP",
  weightKg: number,
  targetKcal: number,
) {
  const proteinGPerKg = goal === "CUT" || goal === "RECOMP" ? 2.2 : 1.8;
  const fatGPerKg = goal === "BULK" ? 1.0 : 0.9;

  const p = Math.round(weightKg * proteinGPerKg);
  const f = Math.round(weightKg * fatGPerKg);
  const remainingKcal = targetKcal - p * 4 - f * 9;
  const c = Math.round(Math.max(0, remainingKcal / 4));

  return { p, c, f };
}

// --- 4) Week plan generation (deterministic, no AI) ----------------------------

export interface MacroTarget {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

/**
 * Generate a 7-day diet plan from the recipe catalog.
 * Deterministic: picks real recipes, distributes meals across slots, scales to hit macro targets.
 * No AI involved — this is the fallback when AI provider is not configured.
 */
export async function generateWeekPlan(
  prisma: PrismaClient,
  clientId: string,
  trainerId: string,
  diet: string,
  exclusions: string,
  target: MacroTarget,
  weekStart: Date,
  distribution?: Record<string, number>,
) {
  // Fetch compatible recipes
  // NOTE: On SQLite, dietTags/allergens are JSON strings, so we use contains.
  // On Postgres, switch to { has: diet } for proper array queries.
  const recipes = await prisma.recipe.findMany({
    where: {
      OR: [{ trainerId }, { trainerId: null }],
      dietTags: { contains: diet },
      NOT: { allergens: { contains: exclusions || "" } },
    },
    orderBy: { name: "asc" },
  });

  if (recipes.length === 0) {
    throw new Error("No compatible recipes found — check catalog diet/allergen tags.");
  }

  // Group recipes by category for structured meal building
  const byCategory = new Map<string, typeof recipes>();
  for (const r of recipes) {
    const list = byCategory.get(r.category) || [];
    list.push(r);
    byCategory.set(r.category, list);
  }

  // Meal slots per day with category preferences
  const defaultDist = { COLAZIONE: 25, SPUNTINO_MATTINA: 10, PRANZO: 35, SPUNTINO_POMERIGGIO: 10, CENA: 20 };
  const dist = { ...defaultDist, ...distribution };

  const mealSlots = [
    { name: "COLAZIONE", preferredCategories: ["GRAINS_WHOLE", "DAIRY_PROTEIN", "EGGS", "FRUIT"] },
    { name: "SPUNTINO_MATTINA", preferredCategories: ["FRUIT", "NUTS", "DAIRY_PROTEIN"] },
    { name: "PRANZO", preferredCategories: ["PROT_ANIMAL_LEAN", "GRAINS_WHOLE", "VEG", "FATS"] },
    { name: "SPUNTINO_POMERIGGIO", preferredCategories: ["DAIRY_PROTEIN", "NUTS", "FRUIT"] },
    { name: "CENA", preferredCategories: ["FISH_LEAN", "FISH_FAT", "VEG", "TUBERS", "GRAINS_WHOLE"] },
  ];

  // Create the diet plan
  const plan = await prisma.dietPlan.create({
    data: {
      clientId,
      weekStart,
      targetKcal: Math.round(target.kcal),
      targetProteinG: Math.round(target.proteinG),
      targetCarbG: Math.round(target.carbG),
      targetFatG: Math.round(target.fatG),
      status: "DRAFT",
      generatedBy: "AI",
    },
  });

  // Generate meals for each day (Mon-Sun)
  for (let day = 0; day < 7; day++) {
    for (const slot of mealSlots) {
      const slotPct = (dist as Record<string, number>)[slot.name] || 10;
      const slotKcal = Math.round(target.kcal * slotPct / 100);

      // Find a recipe from preferred categories
      let recipe = pickRecipe(byCategory, slot.preferredCategories);

      // Fallback: any recipe
      if (!recipe && recipes.length > 0) {
        recipe = recipes[Math.floor(day * slotPct * recipes.length / 100) % recipes.length];
      }

      if (!recipe) continue;

      // Scale grams to hit slot kcal target
      const grams = recipe.kcalPer100g > 0
        ? Math.round((slotKcal / recipe.kcalPer100g) * 100)
        : 100;

      // Compute actual macros from recipe
      const actualKcal = Math.round((recipe.kcalPer100g * grams) / 100);
      const actualP = Math.round((recipe.proteinPer100g * grams) / 100);
      const actualC = Math.round((recipe.carbPer100g * grams) / 100);
      const actualF = Math.round((recipe.fatPer100g * grams) / 100);

      await prisma.dietPlanMeal.create({
        data: {
          dietPlanId: plan.id,
          dayOfWeek: day,
          slot: slot.name as "COLAZIONE" | "SPUNTINO_MATTINA" | "PRANZO" | "SPUNTINO_POMERIGGIO" | "CENA",
          recipeId: recipe.id,
          grams,
          kcal: actualKcal,
          proteinG: actualP,
          carbG: actualC,
          fatG: actualF,
        },
      });
    }
  }

  return plan;
}

function pickRecipe(
  byCategory: Map<string, { id: string; name: string; kcalPer100g: number; proteinPer100g: number; carbPer100g: number; fatPer100g: number }[]>,
  preferredCategories: string[],
) {
  for (const cat of preferredCategories) {
    const list = byCategory.get(cat);
    if (list && list.length > 0) {
      return list[Math.floor(Math.random() * list.length)];
    }
  }
  return null;
}
