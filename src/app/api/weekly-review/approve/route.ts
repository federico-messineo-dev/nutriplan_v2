import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcBMR, calcTDEE, computeMacroTargets } from "@/lib/nutrition-engine";
import type { ProfileForCalc } from "@/lib/nutrition-engine";

// POST /api/weekly-review/approve — persist the recalibration as a new DietPlan
export async function POST(req: NextRequest) {
  const { clientId, targetKcal, targetProteinG, targetCarbG, targetFatG } =
    await req.json();

  if (!clientId || !targetKcal) {
    return NextResponse.json(
      { error: "clientId and targetKcal required" },
      { status: 400 },
    );
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Determine week start (Monday of this week)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  // If there's already a plan for this week, archive it
  const existingPlan = await prisma.dietPlan.findFirst({
    where: {
      clientId,
      weekStart,
      status: "ACTIVE",
    },
  });
  if (existingPlan) {
    await prisma.dietPlan.update({
      where: { id: existingPlan.id },
      data: { status: "ARCHIVED" },
    });
  }

  // Compute macros if not provided
  let macros = { p: targetProteinG, c: targetCarbG, f: targetFatG };
  if (!targetProteinG || !targetCarbG || !targetFatG) {
    const profile: ProfileForCalc = {
      sex: client.sex as "M" | "F" | null,
      age: client.age,
      heightCm: client.heightCm,
      activityFactor: client.activityFactor,
      goal: client.goal as "CUT" | "MAINTAIN" | "BULK" | "RECOMP",
      bmrManualKcal: client.bmrManualKcal,
      tdeeManualKcal: client.tdeeManualKcal,
    };
    macros = computeMacroTargets(
      profile.goal,
      client.startWeightKg || 70,
      targetKcal,
    );
  }

  // Create the new DietPlan
  const plan = await prisma.dietPlan.create({
    data: {
      clientId,
      weekStart,
      targetKcal: Math.round(targetKcal),
      targetProteinG: Math.round(macros.p),
      targetCarbG: Math.round(macros.c),
      targetFatG: Math.round(macros.f),
      status: "ACTIVE",
      generatedBy: "TRAINER", // trainer approved this
      approvedByTrainerAt: new Date(),
    },
  });

  // Log approval as a check-in note
  await prisma.checkIn.create({
    data: {
      clientId,
      notes: `[WEEKLY_REVIEW_APPROVED] planId=${plan.id} target=${Math.round(targetKcal)}kcal p=${Math.round(macros.p)}g c=${Math.round(macros.c)}g f=${Math.round(macros.f)}g`,
      source: "MANUAL",
    },
  });

  return NextResponse.json({ plan });
}
