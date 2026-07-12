import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerId } from "@/lib/auth";

// GET /api/plans — list all diet plans for the trainer's clients
export async function GET() {
  const trainerId = getTrainerId();

  const plans = await prisma.dietPlan.findMany({
    where: { client: { trainerId } },
    include: {
      client: { select: { id: true, fullName: true } },
      meals: {
        select: { id: true, slot: true, kcal: true, proteinG: true, carbG: true, fatG: true, grams: true, recipe: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = plans.map((p) => ({
    id: p.id,
    clientId: p.clientId,
    clientName: p.client.fullName,
    weekStart: p.weekStart,
    targetKcal: p.targetKcal,
    targetProteinG: p.targetProteinG,
    targetCarbG: p.targetCarbG,
    targetFatG: p.targetFatG,
    status: p.status,
    generatedBy: p.generatedBy,
    approvedByTrainerAt: p.approvedByTrainerAt,
    mealCount: p.meals.length,
    totalKcal: p.meals.reduce((sum, m) => sum + m.kcal, 0),
    createdAt: p.createdAt,
  }));

  return NextResponse.json({ plans: result });
}
