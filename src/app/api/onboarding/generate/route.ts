import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import {
  calcBMR,
  calcTDEE,
  computeMacroTargets,
  generateWeekPlan,
} from "@/lib/nutrition-engine";
import type { ProfileForCalc } from "@/lib/nutrition-engine";

// POST /api/onboarding/generate — generate draft diet + training plan for a new client
export async function POST(req: NextRequest) {
  const { clientId } = await req.json();

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // 1. Compute BMR/TDEE
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

  let bmr: number, tdee: number;
  try {
    bmr = calcBMR(profile, currentWeight);
    const tdeeResult = calcTDEE(profile, currentWeight);
    tdee = tdeeResult.tdeeKcal;
  } catch {
    return NextResponse.json(
      { error: "Cannot compute BMR/TDEE — incomplete profile (need sex, age, height)" },
      { status: 400 },
    );
  }

  // 2. Compute macro targets
  const macros = computeMacroTargets(profile.goal, currentWeight, tdee);

  // 3. Determine week start (next Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + daysUntilMonday);
  weekStart.setHours(0, 0, 0, 0);

  // 4. Generate draft diet plan
  let mealDistribution: Record<string, number> | undefined;
  try {
    if (client.mealDistribution) {
      mealDistribution = JSON.parse(client.mealDistribution);
    }
  } catch { /* use default */ }

  const dietPlan = await generateWeekPlan(
    prisma,
    client.id,
    client.trainerId,
    client.diet as "ONNIVORO" | "PESCETARIANO" | "VEGETARIANO" | "VEGANO",
    client.exclusions,
    {
      kcal: tdee,
      proteinG: macros.p,
      carbG: macros.c,
      fatG: macros.f,
    },
    weekStart,
    mealDistribution,
  );

  // 5. Create workout plan skeleton (deterministic, no AI)
  const trainingDays = client.trainingDaysWk || 3;
  const workoutPlan = await createWorkoutPlanSkeleton(
    prisma,
    client.id,
    weekStart,
    trainingDays,
    client.goal,
  );

  // 6. Log the onboarding generation
  await prisma.checkIn.create({
    data: {
      clientId,
      notes: `[ONBOARDING_GENERATED] dietPlanId=${dietPlan.id} workoutPlanId=${workoutPlan.id} tdee=${tdee}kcal`,
      source: "MANUAL",
    },
  });

  return NextResponse.json({
    dietPlan,
    workoutPlan,
    tdee,
    macros,
    bmr,
  });
}

/**
 * Create a workout plan skeleton with default exercises per training day.
 * Deterministic — no AI. Uses exercise names from a built-in library.
 */
async function createWorkoutPlanSkeleton(
  prisma: PrismaClient,
  clientId: string,
  weekStart: Date,
  trainingDays: number,
  goal: string,
) {
  // Default exercise templates per training split
  const splitTemplates: Record<number, { name: string; exercises: string[] }[]> = {
    3: [
      {
        name: "A — Upper Body",
        exercises: ["Panca piana", "Rematore", "Military press", "Curl bicipiti", "Tricipiti ai cavi"],
      },
      {
        name: "B — Lower Body",
        exercises: ["Squat", "Romanian deadlift", "Leg press", "Affondi", "Calf raises"],
      },
      {
        name: "C — Full Body",
        exercises: ["Deadlift", "Pull-up", "Push press", "Panco row", "Plank"],
      },
    ],
    4: [
      {
        name: "A — Petto & Tricipiti",
        exercises: ["Panca piana", "Panca inclinata", "Croci", "Dips", "Tricipiti ai cavi"],
      },
      {
        name: "B — Schiena & Bicipiti",
        exercises: ["Rematore", "Pull-down", "Trazioni", "Curl manubri", "Curl a martello"],
      },
      {
        name: "C — Spalle & Core",
        exercises: ["Military press", "Laterali", "Face pull", "Alzate posteriori", "Plank"],
      },
      {
        name: "D — Gambe",
        exercises: ["Squat", "Leg press", "Romanian deadlift", "Affondi", "Calf raises"],
      },
    ],
    5: [
      {
        name: "A — Petto",
        exercises: ["Panca piana", "Panca inclinata", "Croci", "Pec deck", "Push-up"],
      },
      {
        name: "B — Schiena",
        exercises: ["Rematore", "Pull-down", "Trazioni", "Pulley basso", "Hyperextension"],
      },
      {
        name: "C — Spalle",
        exercises: ["Military press", "Laterali", "Face pull", "Alzate posteriori", "Shrugs"],
      },
      {
        name: "D — Gambe",
        exercises: ["Squat", "Leg press", "Romanian deadlift", "Affondi", "Calf raises"],
      },
      {
        name: "E — Braccia & Core",
        exercises: ["Curl bicipiti", "Tricipiti ai cavi", "Curl a martello", "Dips", "Plank"],
      },
    ],
  };

  const templates = splitTemplates[trainingDays] || splitTemplates[3];

  // Create or find exercises
  const exerciseMap = new Map<string, string>();
  for (const template of templates) {
    for (const exName of template.exercises) {
      let exercise = await prisma.exercise.findFirst({ where: { name: exName } });
      if (!exercise) {
        exercise = await prisma.exercise.create({
          data: {
            name: exName,
            muscleGroup: inferMuscleGroup(exName),
            trainerId: null, // global exercise
          },
        });
      }
      exerciseMap.set(exName, exercise.id);
    }
  }

  // Create workout plan
  const plan = await prisma.workoutPlan.create({
    data: {
      clientId,
      weekStart,
      status: "DRAFT",
      generatedBy: "AI",
    },
  });

  // Assign training days (spread across the week)
  const trainingDayIndices = getTrainingDays(trainingDays);

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const dayOfWeek = trainingDayIndices[i];

    const session = await prisma.workoutSession.create({
      data: {
        workoutPlanId: plan.id,
        dayOfWeek,
        name: template.name,
      },
    });

    for (let j = 0; j < template.exercises.length; j++) {
      const exName = template.exercises[j];
      const exerciseId = exerciseMap.get(exName);
      if (!exerciseId) continue;

      await prisma.workoutSessionExercise.create({
        data: {
          workoutSessionId: session.id,
          exerciseId,
          targetSets: goal === "BULK" ? 4 : 3,
          targetRepsMin: goal === "BULK" ? 6 : 8,
          targetRepsMax: goal === "BULK" ? 10 : 12,
          targetRpe: 7,
          orderIndex: j,
        },
      });
    }
  }

  return plan;
}

function getTrainingDays(count: number): number[] {
  // Spread training days: Mon/Wed/Fri for 3, Mon/Tue/Thu/Fri for 4, Mon-Fri for 5
  const patterns: Record<number, number[]> = {
    3: [1, 3, 5],
    4: [1, 2, 4, 5],
    5: [1, 2, 3, 4, 5],
  };
  return patterns[count] || patterns[3];
}

function inferMuscleGroup(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("panca") || lower.includes("petto") || lower.includes("croci") || lower.includes("pec") || lower.includes("push") || lower.includes("dips"))
    return "Petto";
  if (lower.includes("rematore") || lower.includes("pull") || lower.includes("trazioni") || lower.includes("schiena") || lower.includes("hyper"))
    return "Schiena";
  if (lower.includes("military") || lower.includes("laterali") || lower.includes("face pull") || lower.includes("alzate") || lower.includes("shrugs") || lower.includes("spalle"))
    return "Spalle";
  if (lower.includes("squat") || lower.includes("leg") || lower.includes("romanian") || lower.includes("affondi") || lower.includes("calf") || lower.includes("gambe"))
    return "Gambe";
  if (lower.includes("curl") || lower.includes("bicipiti"))
    return "Bicipiti";
  if (lower.includes("tricipit"))
    return "Tricipiti";
  if (lower.includes("deadlift"))
    return "Schiena";
  if (lower.includes("plank"))
    return "Core";
  return "Generale";
}
