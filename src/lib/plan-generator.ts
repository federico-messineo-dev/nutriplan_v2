import { z } from "zod";
import type { PrismaClient } from "@prisma/client";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

// --- Zod schemas for AI output validation ---

const SLOT_MAP: Record<string, string> = {
  colazione: "COLAZIONE", colazion: "COLAZIONE", col: "COLAZIONE", breakfast: "COLAZIONE",
  "spuntino mattina": "SPUNTINO_MATTINA", "spuntino di mattina": "SPUNTINO_MATTINA",
  "spuntino mattutino": "SPUNTINO_MATTINA", "spuntino del mattino": "SPUNTINO_MATTINA",
  "morning snack": "SPUNTINO_MATTINA", "morning_snack": "SPUNTINO_MATTINA",
  pranzo: "PRANZO", pranz: "PRANZO", lunch: "PRANZO", "midday": "PRANZO",
  "spuntino pomeriggio": "SPUNTINO_POMERIGGIO", "spuntino di pomeriggio": "SPUNTINO_POMERIGGIO",
  "spuntino pomeridiano": "SPUNTINO_POMERIGGIO", merenda: "SPUNTINO_POMERIGGIO",
  "afternoon snack": "SPUNTINO_POMERIGGIO", "afternoon_snack": "SPUNTINO_POMERIGGIO",
  cena: "CENA", cen: "CENA", dinner: "CENA", supper: "CENA",
  spuntino: "SPUNTINO_MATTINA",
};

function normalizeSlot(v: unknown) {
  const raw = String(v).toLowerCase().trim().replace(/["'']/g, "");
  if (SLOT_MAP[raw]) return SLOT_MAP[raw];

  // Fuzzy fallback: find closest keyword match
  const has = (key: string) => raw.includes(key);
  if (has("colazion") || has("breakfast") || has("mattina") || has("mattutino") || has("morn")) return "COLAZIONE";
  if (has("pranzo") || has("lunch") || has("mezzogiorno") || has("midday")) return "PRANZO";
  if (has("cena") || has("dinner") || has("supper") || has("sera")) return "CENA";
  if (has("pomeriggio") || has("merenda") || has("afternoon")) return "SPUNTINO_POMERIGGIO";
  if (has("spuntino") || has("snack") || has("mattino")) return "SPUNTINO_MATTINA";

  return raw.toUpperCase().replace(/\s+/g, "_").replace(/["'']/g, "");
}

const MealItemSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  slot: z.preprocess(normalizeSlot, z.enum(["COLAZIONE", "SPUNTINO_MATTINA", "PRANZO", "SPUNTINO_POMERIGGIO", "CENA"])),
  food: z.string().min(1),
  grams: z.number().int().positive(),
});

const DietPlanOutputSchema = z.object({
  items: z.array(MealItemSchema).min(1),
  rationale: z.string().optional(),
});

const WorkoutExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  targetSets: z.number().int().positive(),
  targetRepsMin: z.number().int().positive(),
  targetRepsMax: z.number().int().positive(),
  targetRpe: z.number().min(0).max(10).optional(),
});

const WorkoutSessionSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  name: z.string().min(1),
  exercises: z.array(WorkoutExerciseSchema).min(1),
});

const WorkoutPlanOutputSchema = z.object({
  sessions: z.array(WorkoutSessionSchema).min(1),
  rationale: z.string().optional(),
});

// --- Helpers ---

function extractJSON(raw: string): unknown {
  const stripped = raw.replace(/```(?:json)?\s*/g, "").replace(/\s*```/g, "").trim();
  let lastErr: unknown;

  const strategies = [
    () => JSON.parse(stripped),
    () => JSON.parse(stripped.match(/\{[\s\S]*\}/)?.[0] || "null"),
    () => JSON.parse(stripped.match(/\[[\s\S]*\]/)?.[0] || "null"),
  ];

  for (const tryParse of strategies) {
    try {
      const result = tryParse();
      if (result !== null) return result;
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(`Risposta AI non valida: JSON non trovato. Risposta grezza: ${raw.slice(0, 500)}`);
}

async function groqJSON<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Chiave GROQ mancante. Aggiungi GROQ_API_KEY nelle variabili d'ambiente di Vercel.");
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Sei un nutrizionista e personal trainer italiano. Rispondi SOLO con JSON valido, senza testo aggiuntivo, senza markdown, senza code block.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const parsed = extractJSON(text);

  const direct = schema.safeParse(parsed);
  if (direct.success) return direct.data;

  // If the model returned an array directly, wrap it
  if (Array.isArray(parsed)) {
    const wrapped = schema.safeParse({ items: parsed });
    if (wrapped.success) return wrapped.data;
  }

  throw direct.error;
}

// --- Public API ---

export async function generateDietPlan(
  prisma: PrismaClient,
  clientId: string,
  trainerId: string,
  weekStart: Date,
) {
  const [client, recipes] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        checkIns: { orderBy: { createdAt: "desc" }, take: 10 },
        dietPlans: { orderBy: { createdAt: "desc" }, take: 3, include: { meals: true } },
      },
    }),
    prisma.recipe.findMany({
      where: {
        OR: [{ trainerId }, { trainerId: null }],
      },
    }),
  ]);

  if (!client) throw new Error("Client not found");
  if (recipes.length === 0) throw new Error("No recipes found — add foods first");

  const goalLabel =
    client.goal === "CUT" ? "Deficit calorico (dimagrimento)" :
    client.goal === "BULK" ? "Surplus calorico (massa)" :
    client.goal === "RECOMP" ? "Ricomposizione corporea" :
    "Mantenimento";

  const latestCheckIn = client.checkIns[0];
  const lastPlan = client.dietPlans[0];
  const targetKcal = lastPlan?.targetKcal || 2000;
  const targetP = lastPlan?.targetProteinG || 120;
  const targetC = lastPlan?.targetCarbG || 200;
  const targetF = lastPlan?.targetFatG || 60;

  // Build catalog: use names as keys (LLMs remember names better than IDs)
  const nameToRecipe = new Map(recipes.map((r) => [r.name.toLowerCase().trim(), r]));
  const catalogText = recipes
    .map((r) => `- "${r.name}" | ${r.kcalPer100g} kcal/100g | P:${r.proteinPer100g}g C:${r.carbPer100g}g F:${r.fatPer100g}g | ${r.category}`)
    .join("\n");

  const prompt = `Sei un nutrizionista sportivo. Genera un piano alimentare di 7 giorni (lunedì a domenica).

PROFILO CLIENTE:
- Nome: ${client.fullName}
- Sesso: ${client.sex === "M" ? "Maschio" : client.sex === "F" ? "Femmina" : "Non specificato"}
- Età: ${client.age ?? "N/D"}
- Altezza: ${client.heightCm ?? "N/D"} cm
- Peso attuale: ${latestCheckIn?.weightKg ?? client.startWeightKg ?? "N/D"} kg
- Obiettivo: ${goalLabel}
- Obiettivo giornaliero: ${targetKcal} kcal | P:${targetP}g C:${targetC}g F:${targetF}g
- Regime alimentare: ${client.diet}
- Esclusioni: ${(Array.isArray(client.exclusions) ? (client.exclusions as string[]).join(", ") : typeof client.exclusions === "string" ? client.exclusions : "nessuna")}
- Giorni training/sett: ${client.trainingDaysWk ?? 3}

NOTE CLIENTE:
${client.medicalNotes || "Nessuna nota medica"}

CHECK-IN RECENTI:
${client.checkIns.map((c) => `- ${new Date(c.createdAt).toLocaleDateString()}: peso=${c.weightKg ?? "N/D"}kg, sonno=${c.sleepHours ?? "N/D"}h, energia=${c.energyLevel ?? "N/D"}/10, aderenza=${c.adherencePct ?? "N/D"}%${c.notes ? " — " + c.notes : ""}`).join("\n") || "Nessun check-in disponibile"}

CATALOGO ALIMENTI (usa SOLO questi, indicandoli per nome esatto tra virgolette):
${catalogText}

REGOLE:
1. Usa SOLO gli alimenti dal catalogo sopra — mai inventare cibi. Il campo "food" deve essere il nome esatto dal catalogo.
2. Per ogni pasto assegna: food (nome esatto), grammi.
3. Distribuisci le kcal nell'arco della giornata in modo bilanciato.
4. Tieni conto delle preferenze ed esclusioni del cliente.
5. Varia gli alimenti nei vari giorni — non ripetere sempre gli stessi pasti.

Rispondi SOLO con questo JSON (senza markdown, senza testo aggiuntivo):
{"items":[{"dayOfWeek":1,"slot":"COLAZIONE","food":"Nome esatto dal catalogo","grams":100}]}`;

  const output = await groqJSON(prompt, DietPlanOutputSchema);

  // Map food names back to recipe IDs
  const recipeById = new Map(recipes.map((r) => [r.id, r]));
  const validated: Array<{ recipeId: string; grams: number; kcal: number; proteinG: number; carbG: number; fatG: number; dayOfWeek: number; slot: string }> = [];

  for (const item of output.items) {
    const key = item.food.toLowerCase().trim();
    const recipe = nameToRecipe.get(key) || recipes.find((r) => r.name.toLowerCase().trim() === key);
    if (!recipe) {
      const known = [...nameToRecipe.keys()].slice(0, 10).join(", ");
      throw new Error(`Alimento "${item.food}" non trovato nel catalogo. Alimenti disponibili: ${known}...`);
    }

    const factor = item.grams / 100;
    validated.push({
      recipeId: recipe.id,
      grams: item.grams,
      kcal: Math.round(recipe.kcalPer100g * factor),
      proteinG: Math.round(recipe.proteinPer100g * factor),
      carbG: Math.round(recipe.carbPer100g * factor),
      fatG: Math.round(recipe.fatPer100g * factor),
      dayOfWeek: item.dayOfWeek,
      slot: item.slot,
    });
  }

  // Check daily totals and scale if outside 5% tolerance
  const TOLERANCE = 0.05;
  for (let day = 1; day <= 7; day++) {
    const dayMeals = validated.filter((m) => m.dayOfWeek === day);
    if (dayMeals.length === 0) continue;

    const dayKcal = dayMeals.reduce((s, m) => s + m.kcal, 0);
    if (Math.abs(dayKcal - targetKcal) / targetKcal > TOLERANCE) {
      const scale = targetKcal / dayKcal;
      for (const meal of dayMeals) {
        meal.grams = Math.round(meal.grams * scale);
        const factor = meal.grams / 100;
        const recipe = recipeById.get(meal.recipeId)!;
        meal.kcal = Math.round(recipe.kcalPer100g * factor);
        meal.proteinG = Math.round(recipe.proteinPer100g * factor);
        meal.carbG = Math.round(recipe.carbPer100g * factor);
        meal.fatG = Math.round(recipe.fatPer100g * factor);
      }
    }
  }

  // Save plan
  const plan = await prisma.dietPlan.create({
    data: {
      clientId,
      weekStart,
      targetKcal,
      targetProteinG: targetP,
      targetCarbG: targetC,
      targetFatG: targetF,
      status: "DRAFT",
      generatedBy: "AI",
    },
  });

  for (const meal of validated) {
    await prisma.dietPlanMeal.create({
      data: {
        dietPlanId: plan.id,
        dayOfWeek: meal.dayOfWeek,
        slot: meal.slot as any,
        recipeId: meal.recipeId,
        grams: meal.grams,
        kcal: meal.kcal,
        proteinG: meal.proteinG,
        carbG: meal.carbG,
        fatG: meal.fatG,
      },
    });
  }

  return plan;
}

export async function generateWorkoutPlan(
  prisma: PrismaClient,
  clientId: string,
  trainerId: string,
  weekStart: Date,
) {
  const [client, exercises] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        checkIns: { orderBy: { createdAt: "desc" }, take: 10 },
        workoutPlans: { orderBy: { createdAt: "desc" }, take: 3, include: { sessions: { include: { exercises: true } } } },
      },
    }),
    prisma.exercise.findMany({
      where: {
        OR: [{ trainerId }, { trainerId: null }],
      },
    }),
  ]);

  if (!client) throw new Error("Client not found");
  if (exercises.length === 0) throw new Error("No exercises found — add exercises first");

  const goalLabel =
    client.goal === "CUT" ? "Deficit calorico (dimagrimento)" :
    client.goal === "BULK" ? "Surplus calorico (massa)" :
    client.goal === "RECOMP" ? "Ricomposizione corporea" :
    "Mantenimento";

  const trainingDays = client.trainingDaysWk ?? 3;
  const latestCheckIn = client.checkIns[0];

  const catalogText = exercises
    .map((e) => `- id:${e.id} | ${e.name} | ${e.muscleGroup}${e.equipment ? " (" + e.equipment + ")" : ""}`)
    .join("\n");

  const prompt = `Sei un personal trainer specializzato in bodybuilding e allenamento della forza. Crea una scheda di allenamento di ${trainingDays} giorni a settimana.

PROFILO CLIENTE:
- Nome: ${client.fullName}
- Sesso: ${client.sex === "M" ? "Maschio" : client.sex === "F" ? "Femmina" : "Non specificato"}
- Età: ${client.age ?? "N/D"}
- Peso: ${latestCheckIn?.weightKg ?? client.startWeightKg ?? "N/D"} kg
- Obiettivo: ${goalLabel}
- Giorni training/sett: ${trainingDays}

NOTE E INFORTUNI:
${client.medicalNotes || "Nessuna nota"}

ESERCIZI DISPONIBILI (usa SOLO questi, per ID):
${catalogText}

REGOLE:
1. Usa SOLO gli esercizi dal catalogo — mai inventare.
2. Distribuisci i ${trainingDays} giorni in settimana (es. lunedì-mercedì-venerdì per 3 giorni).
3. Per ogni esercizio: serie, ripetizioni (min-max), e RPE opzionale (6-10).
4. Bilancia i gruppi muscolari nei vari giorni.
5. Rispetta eventuali note su infortuni o limitazioni.

Rispondi SOLO con questo JSON (senza markdown, senza testo aggiuntivo):
{"sessions":[{"dayOfWeek":1,"name":"Petto e Tricipiti","exercises":[{"exerciseId":"...","targetSets":4,"targetRepsMin":8,"targetRepsMax":12,"targetRpe":8}]}]}`;

  const output = await groqJSON(prompt, WorkoutPlanOutputSchema);

  // Validate exercises exist
  const exerciseIds = new Set(exercises.map((e) => e.id));
  for (const session of output.sessions) {
    for (const ex of session.exercises) {
      if (!exerciseIds.has(ex.exerciseId)) {
        throw new Error(`AI ha usato un esercizio sconosciuto: ${ex.exerciseId}`);
      }
    }
  }

  // Save plan
  const plan = await prisma.workoutPlan.create({
    data: {
      clientId,
      weekStart,
      status: "DRAFT",
      generatedBy: "AI",
    },
  });

  for (const session of output.sessions) {
    const ws = await prisma.workoutSession.create({
      data: {
        workoutPlanId: plan.id,
        dayOfWeek: session.dayOfWeek,
        name: session.name,
      },
    });

    for (let i = 0; i < session.exercises.length; i++) {
      const ex = session.exercises[i];
      await prisma.workoutSessionExercise.create({
        data: {
          workoutSessionId: ws.id,
          exerciseId: ex.exerciseId,
          targetSets: ex.targetSets,
          targetRepsMin: ex.targetRepsMin,
          targetRepsMax: ex.targetRepsMax,
          targetRpe: ex.targetRpe ?? null,
          orderIndex: i,
        },
      });
    }
  }

  return plan;
}
