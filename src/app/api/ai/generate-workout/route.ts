import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generate } from "@/lib/ai-provider";
import { z } from "zod";

const GenerateWorkoutSchema = z.object({
  clientId: z.string(),
  weekStart: z.string().optional(),
});

const TRAINING_DAY_PATTERNS: Record<number, number[]> = {
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
};

// POST /api/ai/generate-workout — AI-powered workout plan generation
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, weekStart } = GenerateWorkoutSchema.parse(body);

  // 1. Fetch client
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });
  }

  // 2. Validate required fields
  const missingFields: string[] = [];
  if (!client.sex) missingFields.push("sesso");
  if (!client.age) missingFields.push("età");
  if (!client.heightCm) missingFields.push("altezza");
  if (!client.startWeightKg) missingFields.push("peso attuale");

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: "Dati cliente incompleti",
        missingFields,
        message: `Compila i seguenti campi prima di generare il piano: ${missingFields.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // 3. Fetch available exercises
  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [{ trainerId: client.trainerId }, { trainerId: null }],
    },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });

  if (exercises.length === 0) {
    return NextResponse.json(
      { error: "Nessun esercizio nel catalogo. Aggiungi esercizi nelle Impostazioni prima di generare." },
      { status: 400 },
    );
  }

  // 4. Determine week start
  const planWeekStart = weekStart
    ? new Date(weekStart)
    : (() => {
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? 1 : 8 - day;
        const d = new Date(now);
        d.setDate(now.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
      })();

  const trainingDays = client.trainingDaysWk || 3;

  // 5. Build exercise catalog for AI
  const exerciseCatalog = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    muscleGroup: e.muscleGroup,
    equipment: e.equipment || "N/A",
    substitutionGroup: e.substitutionGroup || "N/A",
  }));

  // 6. Call AI
  const systemPrompt = `Sei un personal trainer esperto che programma piani di allenamento.
Devi creare una split settimanale usando SOLO gli esercizi forniti nel catalogo (per ID).
NON inventare esercizi. Per ogni esercizio specifica: series, repsMin, repsMax, targetRpe.
Varietà: alterna gli esercizi tra le sessioni, non ripetere la stessa sessione tutti i giorni.
Rispetta il numero di giorni di allenamento settimanali (${trainingDays}) e l'obiettivo del cliente.`;

  const userPrompt = `Genera un piano di allenamento settimanale per questo cliente:

PROFILO:
- Sesso: ${client.sex}, Età: ${client.age} anni
- Peso: ${client.startWeightKg} kg, Altezza: ${client.heightCm} cm
- Obiettivo: ${client.goal}
- Giorni di allenamento a settimana: ${trainingDays}

SPLIT TEMPLATE (${trainingDays} giorni):
${getSplitDescription(trainingDays)}

CATALOGO ESERCIZI:
${JSON.stringify(exerciseCatalog)}

Genera il piano per ${trainingDays} sessioni. Per ogni sessione, elenca gli esercizi con serie, ripetizioni e RPE target.`;

  let aiResult;
  try {
    aiResult = await generate({
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 4096,
    });
  } catch (aiError) {
    console.warn("AI provider not available:", aiError);
    return NextResponse.json(
      {
        error: "AI non configurato. Configura AI_PROVIDER e AI_API_KEY in .env.local.",
        fallback: "Puoi usare la generazione deterministica dal menu onboarding.",
      },
      { status: 503 },
    );
  }

  // 7. Parse AI response
  const textContent = aiResult.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    return NextResponse.json(
      { error: "Risposta AI non valida." },
      { status: 500 },
    );
  }

  let parsedPlan: {
    sessions?: Array<{
      name: string;
      dayOfWeek?: number;
      exercises: Array<{
        exerciseId: string;
        sets: number;
        repsMin: number;
        repsMax: number;
        targetRpe: number;
      }>;
    }>;
  };

  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedPlan = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found");
    }
  } catch {
    // Fallback: deterministic plan
    const plan = await createDeterministicWorkoutPlan(
      prisma,
      client.id,
      exercises,
      planWeekStart,
      trainingDays,
      client.goal,
    );
    return NextResponse.json({
      plan,
      note: "Risposta AI non parsabile — piano generato deterministicamente.",
    });
  }

  // 8. Save the workout plan
  const plan = await prisma.workoutPlan.create({
    data: {
      clientId: client.id,
      weekStart: planWeekStart,
      status: "DRAFT",
      generatedBy: "AI",
    },
  });

  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const dayIndices = TRAINING_DAY_PATTERNS[trainingDays] || TRAINING_DAY_PATTERNS[3];

  const sessions = parsedPlan.sessions || [];
  for (let i = 0; i < Math.min(sessions.length, trainingDays); i++) {
    const session = sessions[i];
    const dayOfWeek = session.dayOfWeek ?? dayIndices[i] ?? dayIndices[i % dayIndices.length];

    const workoutSession = await prisma.workoutSession.create({
      data: {
        workoutPlanId: plan.id,
        dayOfWeek,
        name: session.name || `Sessione ${i + 1}`,
      },
    });

    for (let j = 0; j < session.exercises.length; j++) {
      const ex = session.exercises[j];
      const exercise = exerciseMap.get(ex.exerciseId);
      if (!exercise) continue;

      await prisma.workoutSessionExercise.create({
        data: {
          workoutSessionId: workoutSession.id,
          exerciseId: ex.exerciseId,
          targetSets: ex.sets || 3,
          targetRepsMin: ex.repsMin || 8,
          targetRepsMax: ex.repsMax || 12,
          targetRpe: ex.targetRpe || 7,
          orderIndex: j,
        },
      });
    }
  }

  const sessionsCount = await prisma.workoutSession.count({
    where: { workoutPlanId: plan.id },
  });

  return NextResponse.json({
    plan: { id: plan.id, status: plan.status, weekStart: plan.weekStart },
    sessionsCount,
  });
}

// --- Helpers ---
function getSplitDescription(days: number): string {
  const splits: Record<number, string> = {
    3: "A — Upper Body, B — Lower Body, C — Full Body",
    4: "A — Petto & Tricipiti, B — Schiena & Bicipiti, C — Spalle & Core, D — Gambe",
    5: "A — Petto, B — Schiena, C — Spalle, D — Gambe, E — Braccia & Core",
  };
  return splits[days] || splits[3];
}

async function createDeterministicWorkoutPlan(
  prisma: any,
  clientId: string,
  exercises: any[],
  weekStart: Date,
  trainingDays: number,
  goal: string,
) {
  const templates = getSplitTemplates(trainingDays);
  const exerciseMap = new Map<string, string>();
  for (const t of templates) {
    for (const exName of t.exercises) {
      const found = exercises.find(
        (e: any) => e.name.toLowerCase() === exName.toLowerCase(),
      );
      if (found) {
        exerciseMap.set(exName, found.id);
      } else {
        // Fuzzy match
        const fuzzy = exercises.find((e: any) =>
          e.name.toLowerCase().includes(exName.toLowerCase().split(" ")[0]),
        );
        if (fuzzy) exerciseMap.set(exName, fuzzy.id);
      }
    }
  }

  const plan = await prisma.workoutPlan.create({
    data: {
      clientId,
      weekStart,
      status: "DRAFT",
      generatedBy: "AI",
    },
  });

  const dayIndices = TRAINING_DAY_PATTERNS[trainingDays] || TRAINING_DAY_PATTERNS[3];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const dayOfWeek = dayIndices[i];

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

  return { id: plan.id, status: plan.status, weekStart: plan.weekStart };
}

function getSplitTemplates(days: number) {
  const splits: Record<number, { name: string; exercises: string[] }[]> = {
    3: [
      { name: "A — Upper Body", exercises: ["Panca piana", "Rematore", "Military press", "Curl bicipiti", "Tricipiti ai cavi"] },
      { name: "B — Lower Body", exercises: ["Squat", "Romanian deadlift", "Leg press", "Affondi", "Calf raises"] },
      { name: "C — Full Body", exercises: ["Deadlift", "Pull-up", "Push press", "Panco row", "Plank"] },
    ],
    4: [
      { name: "A — Petto & Tricipiti", exercises: ["Panca piana", "Panca inclinata", "Croci", "Dips", "Tricipiti ai cavi"] },
      { name: "B — Schiena & Bicipiti", exercises: ["Rematore", "Pull-down", "Trazioni", "Curl manubri", "Curl a martello"] },
      { name: "C — Spalle & Core", exercises: ["Military press", "Laterali", "Face pull", "Alzate posteriori", "Plank"] },
      { name: "D — Gambe", exercises: ["Squat", "Leg press", "Romanian deadlift", "Affondi", "Calf raises"] },
    ],
    5: [
      { name: "A — Petto", exercises: ["Panca piana", "Panca inclinata", "Croci", "Pec deck", "Push-up"] },
      { name: "B — Schiena", exercises: ["Rematore", "Pull-down", "Trazioni", "Pulley basso", "Hyperextension"] },
      { name: "C — Spalle", exercises: ["Military press", "Laterali", "Face pull", "Alzate posteriori", "Shrugs"] },
      { name: "D — Gambe", exercises: ["Squat", "Leg press", "Romanian deadlift", "Affondi", "Calf raises"] },
      { name: "E — Braccia & Core", exercises: ["Curl bicipiti", "Tricipiti ai cavi", "Curl a martello", "Dips", "Plank"] },
    ],
  };
  return splits[days] || splits[3];
}
