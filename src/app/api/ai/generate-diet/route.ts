import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generate } from "@/lib/ai-provider";
import {
  calcBMR,
  calcTDEE,
  computeMacroTargets,
} from "@/lib/nutrition-engine";
import type { ProfileForCalc } from "@/lib/nutrition-engine";
import { z } from "zod";

const GenerateDietSchema = z.object({
  clientId: z.string(),
  weekStart: z.string().optional(),
});

const MEAL_SLOTS = ["COLAZIONE", "SPUNTINO_MATTINA", "PRANZO", "SPUNTINO_POMERIGGIO", "CENA"] as const;

const MACRO_TOLERANCE_PCT = 0.10;

// POST /api/ai/generate-diet — AI-powered meal plan generation
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, weekStart } = GenerateDietSchema.parse(body);

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

  // 3. Compute BMR/TDEE deterministically
  const profile: ProfileForCalc = {
    sex: client.sex as "M" | "F",
    age: client.age!,
    heightCm: client.heightCm!,
    activityFactor: client.activityFactor,
    goal: client.goal as "CUT" | "MAINTAIN" | "BULK" | "RECOMP",
    bmrManualKcal: client.bmrManualKcal,
    tdeeManualKcal: client.tdeeManualKcal,
  };

  const currentWeight = client.startWeightKg!;
  const bmr = calcBMR(profile, currentWeight);
  const tdeeResult = calcTDEE(profile, currentWeight);
  const tdee = tdeeResult.tdeeKcal;
  const macros = computeMacroTargets(profile.goal, currentWeight, tdee);

  // 4. Fetch compatible foods from catalog
  const recipes = await prisma.recipe.findMany({
    where: {
      OR: [{ trainerId: client.trainerId }, { trainerId: null }],
    },
    orderBy: { name: "asc" },
  });

  if (recipes.length === 0) {
    return NextResponse.json(
      { error: "Nessun alimento nel catalogo. Aggiungi alimenti nelle Impostazioni prima di generare." },
      { status: 400 },
    );
  }

  // 5. Build catalog for AI (compact format)
  const catalog = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    kcalPer100g: r.kcalPer100g,
    proteinPer100g: r.proteinPer100g,
    carbPer100g: r.carbPer100g,
    fatPer100g: r.fatPer100g,
    dietTags: JSON.parse(r.dietTags) as string[],
    allergens: JSON.parse(r.allergens) as string[],
  }));

  const exclusions = JSON.parse(client.exclusions || "[]") as string[];

  // Filter catalog for this client's diet and exclusions
  const compatibleCatalog = catalog.filter((r) => {
    if (!r.dietTags.includes(client.diet)) return false;
    if (exclusions.some((e) => r.allergens.includes(e))) return false;
    return true;
  });

  if (compatibleCatalog.length === 0) {
    return NextResponse.json(
      { error: "Nessun alimento compatibile con la dieta e le esclusioni del cliente." },
      { status: 400 },
    );
  }

  // 6. Parse meal distribution from client profile
  const defaultDistribution = {
    COLAZIONE: 25, SPUNTINO_MATTINA: 10, PRANZO: 35,
    SPUNTINO_POMERIGGIO: 10, CENA: 20,
  };
  let mealDistribution = defaultDistribution;
  try {
    if (client.mealDistribution) {
      mealDistribution = { ...defaultDistribution, ...JSON.parse(client.mealDistribution) };
    }
  } catch { /* use default */ }

  const distributionStr = Object.entries(mealDistribution)
    .map(([slot, pct]) => {
      const label: Record<string, string> = {
        COLAZIONE: "Colazione", SPUNTINO_MATTINA: "Spuntino Mattina",
        PRANZO: "Pranzo", SPUNTINO_POMERIGGIO: "Spuntino Pomeriggio", CENA: "Cena",
      };
      return `${label[slot] || slot} (${pct}%)`;
    }).join(", ");

  // 7. Determine week start
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

  // 7. Call AI to generate meals
  const systemPrompt = `Sei un nutrizionista esperto che compila piani alimentari per una app di gestione clienti.
Devi comporre pasti usando SOLO gli alimenti forniti nel catalogo (per ID).
NON inventare alimenti. NON stimare tu le calorie/macros — le quantità in grammi sono l'unica cosa che decidi.
I valori nutrizionali per 100g sono già forniti e verranno ricalcolati esternamente.
Per ogni pasto, proponi 2-4 alimenti con le quantità in grammi.
Respetta i vincoli: dieta (${client.diet}), esclusioni allergeniche, e target calorici/macro.
Varietà: non ripetere gli stessi pasti tutti i giorni, alterna alimenti della stessa categoria.`;

  const userPrompt = `Genera un piano alimentare settimanale (7 giorni, 5 pasti/giorno) per questo cliente:

PROFILO:
- Sesso: ${client.sex}, Età: ${client.age} anni, Altezza: ${client.heightCm} cm
- Peso attuale: ${currentWeight} kg
- Obiettivo: ${client.goal}
- Fattore attività: ${client.activityFactor}

TARGET:
- Kcal giornaliere: ${Math.round(tdee)}
- Proteine: ${macros.p}g
- Carboidrati: ${macros.c}g
- Grassi: ${macros.f}g

PASTI: ${distributionStr}

CATALOGO ALIMENTI COMPATIBILI:
${JSON.stringify(compatibleCatalog)}

Genera il piano per 7 giorni. Per ogni giorno, per ogni pasto, specifica gli alimenti con grammi.`;

  let aiResult;
  try {
    aiResult = await generate({
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 4096,
    });
  } catch (aiError) {
    // AI not configured — fall back to deterministic generation
    console.warn("AI provider not available, using deterministic fallback:", aiError);
    return NextResponse.json(
      {
        error: "AI non configurato. Configura AI_PROVIDER e AI_API_KEY in .env.local.",
        fallback: "Puoi usare la generazione deterministica dalla tab Strategia.",
      },
      { status: 503 },
    );
  }

  // 8. Parse AI response — extract text and try to parse structured plan
  const textContent = aiResult.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    return NextResponse.json(
      { error: "Risposta AI non valida — nessun testo generato." },
      { status: 500 },
    );
  }

  // Try to parse the AI response as structured JSON plan
  let parsedPlan: ParsedWeekPlan;
  try {
    // Try to extract JSON from the response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedPlan = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found in AI response");
    }
  } catch {
    // If parsing fails, create a deterministic plan as fallback
    const plan = await createDeterministicPlan(
      prisma,
      client,
      compatibleCatalog,
      { kcal: tdee, proteinG: macros.p, carbG: macros.c, fatG: macros.f },
      planWeekStart,
      mealDistribution,
    );
    return NextResponse.json({
      plan,
      tdee: Math.round(tdee),
      macros,
      bmr,
      note: "Risposta AI non parsabile — piano generato deterministicamente.",
    });
  }

  // 9. Save the AI-generated plan
  const plan = await prisma.dietPlan.create({
    data: {
      clientId: client.id,
      weekStart: planWeekStart,
      targetKcal: Math.round(tdee),
      targetProteinG: Math.round(macros.p),
      targetCarbG: Math.round(macros.c),
      targetFatG: Math.round(macros.f),
      status: "DRAFT",
      generatedBy: "AI",
    },
  });

  // 10. Parse and save meals from AI plan
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  let totalSavedKcal = 0;

  for (let day = 0; day < 7; day++) {
    const dayPlan = parsedPlan.days?.[day];
    if (!dayPlan) continue;

    for (let slotIdx = 0; slotIdx < MEAL_SLOTS.length; slotIdx++) {
      const slot = MEAL_SLOTS[slotIdx];
      const slotPlan = dayPlan[slot.toLowerCase()] || dayPlan[slot] || [];
      const items = Array.isArray(slotPlan) ? slotPlan : [];

      for (const item of items) {
        const recipe = recipeMap.get(item.recipeId);
        if (!recipe) continue;

        const grams = item.grams || 100;
        const actualKcal = Math.round((recipe.kcalPer100g * grams) / 100);
        const actualP = Math.round((recipe.proteinPer100g * grams) / 100);
        const actualC = Math.round((recipe.carbPer100g * grams) / 100);
        const actualF = Math.round((recipe.fatPer100g * grams) / 100);

        totalSavedKcal += actualKcal;

        await prisma.dietPlanMeal.create({
          data: {
            dietPlanId: plan.id,
            dayOfWeek: day,
            slot,
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
  }

  return NextResponse.json({
    plan: { id: plan.id, status: plan.status, weekStart: plan.weekStart },
    tdee: Math.round(tdee),
    macros,
    bmr,
    mealsCount: await prisma.dietPlanMeal.count({ where: { dietPlanId: plan.id } }),
  });
}

// --- Deterministic fallback plan ---
interface ParsedWeekPlan {
  days?: Array<Record<string, Array<{ recipeId: string; grams: number }>>>;
}

async function createDeterministicPlan(
  prismaClient: any,
  client: { id: string; trainerId: string; diet: string; exclusions: string },
  catalog: Array<{ id: string; category: string; kcalPer100g: number; proteinPer100g: number; carbPer100g: number; fatPer100g: number }>,
  target: { kcal: number; proteinG: number; carbG: number; fatG: number },
  weekStart: Date,
  distribution: Record<string, number> = { COLAZIONE: 25, SPUNTINO_MATTINA: 10, PRANZO: 35, SPUNTINO_POMERIGGIO: 10, CENA: 20 },
) {
  const byCategory = new Map<string, typeof catalog>();
  for (const r of catalog) {
    const list = byCategory.get(r.category) || [];
    list.push(r);
    byCategory.set(r.category, list);
  }

  const mealSlots = [
    { name: "COLAZIONE", preferredCategories: ["GRAINS_WHOLE", "DAIRY_PROTEIN", "EGGS", "FRUIT"] },
    { name: "SPUNTINO_MATTINA", preferredCategories: ["FRUIT", "NUTS", "DAIRY_PROTEIN"] },
    { name: "PRANZO", preferredCategories: ["PROT_ANIMAL_LEAN", "GRAINS_WHOLE", "VEG", "FATS"] },
    { name: "SPUNTINO_POMERIGGIO", preferredCategories: ["DAIRY_PROTEIN", "NUTS", "FRUIT"] },
    { name: "CENA", preferredCategories: ["FISH_LEAN", "FISH_FAT", "VEG", "TUBERS", "GRAINS_WHOLE"] },
  ];

  const plan = await prismaClient.dietPlan.create({
    data: {
      clientId: client.id,
      weekStart,
      targetKcal: Math.round(target.kcal),
      targetProteinG: Math.round(target.proteinG),
      targetCarbG: Math.round(target.carbG),
      targetFatG: Math.round(target.fatG),
      status: "DRAFT",
      generatedBy: "AI",
    },
  });

  for (let day = 0; day < 7; day++) {
    for (const slot of mealSlots) {
      const slotPct = distribution[slot.name] || 10;
      const slotKcal = Math.round(target.kcal * slotPct / 100);
      let recipe = pickRandom(byCategory, slot.preferredCategories);
      if (!recipe && catalog.length > 0) {
        recipe = catalog[Math.floor(Math.random() * catalog.length)];
      }
      if (!recipe) continue;

      const grams = recipe.kcalPer100g > 0
        ? Math.round((slotKcal / recipe.kcalPer100g) * 100)
        : 100;

      const r = recipe as typeof catalog[number];
      await prismaClient.dietPlanMeal.create({
        data: {
          dietPlanId: plan.id,
          dayOfWeek: day,
          slot: slot.name,
          recipeId: r.id,
          grams,
          kcal: Math.round((r.kcalPer100g * grams) / 100),
          proteinG: Math.round((r.proteinPer100g * grams) / 100),
          carbG: Math.round((r.carbPer100g * grams) / 100),
          fatG: Math.round((r.fatPer100g * grams) / 100),
        },
      });
    }
  }

  return { id: plan.id, status: plan.status, weekStart: plan.weekStart };
}

function pickRandom(
  byCategory: Map<string, { id: string }[]>,
  preferred: string[],
): { id: string; kcalPer100g: number } | null {
  for (const cat of preferred) {
    const list = byCategory.get(cat);
    if (list && list.length > 0) {
      return list[Math.floor(Math.random() * list.length)] as { id: string; kcalPer100g: number };
    }
  }
  return null;
}
