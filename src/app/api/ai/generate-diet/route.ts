import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerId } from "@/lib/auth";
import { generateDietPlan } from "@/lib/plan-generator";
import { z } from "zod";

const GenerateDietSchema = z.object({
  clientId: z.string(),
  weekStart: z.string().optional(),
});

// POST /api/ai/generate-diet — AI-powered meal plan generation
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId } = GenerateDietSchema.parse(body);

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });
  }

  // Validate required fields
  const missingFields: string[] = [];
  if (!client.sex) missingFields.push("sesso");
  if (!client.age) missingFields.push("età");
  if (!client.heightCm) missingFields.push("altezza");
  if (!client.startWeightKg) missingFields.push("peso attuale");

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Dati cliente incompleti", missingFields },
      { status: 400 },
    );
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() + ((7 - weekStart.getDay()) % 7 || 7));
  weekStart.setHours(0, 0, 0, 0);

  try {
    const plan = await generateDietPlan(prisma, clientId, getTrainerId(), weekStart);

    // Count meals
    const meals = await prisma.dietPlanMeal.findMany({ where: { dietPlanId: plan.id } });

    return NextResponse.json({
      success: true,
      mealsCount: meals.length,
      planId: plan.id,
      weekStart: plan.weekStart,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    console.error("generate-diet error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
