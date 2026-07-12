import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calcBMR,
  calcTDEE,
  computeAdaptiveRecalibration,
  computeMacroTargets,
} from "@/lib/nutrition-engine";
import type { ProfileForCalc } from "@/lib/nutrition-engine";

// POST /api/weekly-review — compute recalibration + draft meals for a client
export async function POST(req: NextRequest) {
  const { clientId } = await req.json();

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  // 1. Fetch client with recent check-ins
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      checkIns: {
        orderBy: { createdAt: "desc" },
        take: 12, // last ~3 months of weekly check-ins
      },
      dietPlans: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // 2. Build profile for calc
  const profile: ProfileForCalc = {
    sex: client.sex as "M" | "F" | null,
    age: client.age,
    heightCm: client.heightCm,
    activityFactor: client.activityFactor,
    goal: client.goal as "CUT" | "MAINTAIN" | "BULK" | "RECOMP",
    bmrManualKcal: client.bmrManualKcal,
    tdeeManualKcal: client.tdeeManualKcal,
  };

  const currentWeight = client.startWeightKg || 70;

  // 3. Compute BMR/TDEE
  let bmr: number, tdee: number;
  try {
    bmr = calcBMR(profile, currentWeight);
    const tdeeResult = calcTDEE(profile, currentWeight);
    tdee = tdeeResult.tdeeKcal;
  } catch {
    return NextResponse.json(
      { error: "Cannot compute BMR/TDEE — incomplete profile" },
      { status: 400 },
    );
  }

  // 4. Get previous target (from last plan or computed)
  const lastPlan = client.dietPlans[0];
  const previousTarget = lastPlan?.targetKcal || tdee;

  // 5. Compute adaptive recalibration
  const checkInsForRecalc = client.checkIns
    .filter((c) => c.weightKg != null)
    .map((c) => ({
      weightKg: c.weightKg,
      createdAt: c.createdAt,
    }))
    .reverse(); // oldest first

  const recalibration = computeAdaptiveRecalibration(
    { ...profile, sex: profile.sex || "M" },
    previousTarget,
    checkInsForRecalc,
  );

  // 6. Compute macro targets for the suggested kcal
  const macros = computeMacroTargets(
    profile.goal,
    currentWeight,
    recalibration.suggestedTargetKcal,
  );

  // 7. Draft meal plan (placeholder — AI would generate this)
  const draftedMeals = draftMealsPlaceholder(
    profile.goal,
    recalibration.suggestedTargetKcal,
    macros,
  );

  // 8. Get weight trend for display
  const weightTrend = client.checkIns
    .filter((c) => c.weightKg != null)
    .slice(0, 8)
    .reverse()
    .map((c) => ({
      date: c.createdAt,
      weight: c.weightKg,
    }));

  return NextResponse.json({
    client: {
      id: client.id,
      fullName: client.fullName,
      goal: client.goal,
      diet: client.diet,
    },
    current: {
      bmr,
      tdee,
      previousTarget,
      weight: currentWeight,
    },
    recalibration,
    macros,
    draftedMeals,
    weightTrend,
    checkInCount: checkInsForRecalc.length,
  });
}

/**
 * Placeholder meal draft — deterministic, no AI.
 * When AI provider is configured, replace this with a real AI call.
 * The principle: AI proposes, code validates and repairs.
 */
function draftMealsPlaceholder(
  goal: string,
  targetKcal: number,
  macros: { p: number; c: number; f: number },
) {
  // Simple proportional split: Colazione 25%, Pranzo 35%, Cena 30%, Spuntini 10%
  const meals = [
    {
      name: "Colazione",
      pct: 0.25,
      items: [
        { recipeName: "Fiocchi d'avena", grams: 60 },
        { recipeName: "Whey protein isolata", grams: 30 },
        { recipeName: "Banana", grams: 120 },
        { recipeName: "Burro di arachidi", grams: 15 },
      ],
    },
    {
      name: "Pranzo",
      pct: 0.35,
      items: [
        { recipeName: "Riso basmati (crudo)", grams: 80 },
        { recipeName: "Petto di pollo", grams: 200 },
        { recipeName: "Broccoli", grams: 150 },
        { recipeName: "Olio EVO", grams: 10 },
      ],
    },
    {
      name: "Spuntino",
      pct: 0.10,
      items: [
        { recipeName: "Yogurt greco 0%", grams: 150 },
        { recipeName: "Mandorle", grams: 20 },
      ],
    },
    {
      name: "Cena",
      pct: 0.30,
      items: [
        { recipeName: "Salmone", grams: 180 },
        { recipeName: "Patate lesse", grams: 250 },
        { recipeName: "Insalata mista", grams: 100 },
        { recipeName: "Olio EVO", grams: 10 },
      ],
    },
  ];

  // Scale each meal's items proportionally to hit the target kcal
  return meals.map((meal) => {
    const mealKcal = Math.round(targetKcal * meal.pct);
    return {
      name: meal.name,
      targetKcal: mealKcal,
      items: meal.items,
      note: "Draft deterministico — sostituire con AI quando disponibile",
    };
  });
}
