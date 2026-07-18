import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerId } from "@/lib/auth";
import { generateDietPlan, generateWorkoutPlan } from "@/lib/plan-generator";

// POST /api/plans/generate — generate diet plan, workout plan, or both with AI
export async function POST(req: NextRequest) {
  const trainerId = getTrainerId();

  const body = await req.json();
  const { clientId, type } = body as { clientId: string; type?: "diet" | "workout" | "both" };

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "AI non configurata. Aggiungi OPENROUTER_API_KEY nelle variabili d'ambiente di Vercel (ottienila gratis su https://openrouter.ai/keys)." },
      { status: 400 },
    );
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() + ((7 - weekStart.getDay()) % 7 || 7));
  weekStart.setHours(0, 0, 0, 0);

  try {
    const result: Record<string, unknown> = {};

    if (type === "diet" || type === "both" || !type) {
      const plan = await generateDietPlan(prisma, clientId, trainerId, weekStart);
      result.dietPlan = { id: plan.id, clientId: plan.clientId, weekStart: plan.weekStart, status: plan.status };
    }

    if (type === "workout" || type === "both") {
      const plan = await generateWorkoutPlan(prisma, clientId, trainerId, weekStart);
      result.workoutPlan = { id: plan.id, clientId: plan.clientId, weekStart: plan.weekStart, status: plan.status };
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    console.error("Plan generation error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
