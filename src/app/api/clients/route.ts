import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerId } from "@/lib/auth";

// GET /api/clients — list all clients for the trainer
export async function GET() {
  const trainerId = getTrainerId();

  const clients = await prisma.client.findMany({
    where: { trainerId },
    include: {
      checkIns: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { checkIns: true, dietPlans: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = clients.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    goal: c.goal,
    diet: c.diet,
    sex: c.sex,
    age: c.age,
    heightCm: c.heightCm,
    startWeightKg: c.startWeightKg,
    latestWeight: c.checkIns[0]?.weightKg ?? null,
    checkInCount: c._count.checkIns,
    planCount: c._count.dietPlans,
    status: c.status,
    createdAt: c.createdAt,
  }));

  return NextResponse.json({ clients: result });
}

// POST /api/clients — create a new client
export async function POST(req: NextRequest) {
  const trainerId = getTrainerId();
  const body = await req.json();

  const client = await prisma.client.create({
    data: {
      trainerId,
      fullName: body.fullName || "Nuovo Cliente",
      phoneNumberE164: body.phoneNumberE164 || `+39${Math.floor(3000000000 + Math.random() * 7000000000)}`,
      sex: body.sex || null,
      age: body.age || null,
      heightCm: body.heightCm || null,
      startWeightKg: body.startWeightKg || null,
      diet: body.diet || "ONNIVORO",
      activityFactor: body.activityFactor || 1.55,
      goal: body.goal || "MAINTAIN",
      trainingDaysWk: body.trainingDaysWk || 3,
      waterTargetL: body.waterTargetL || 2,
      exclusions: JSON.stringify(body.exclusions || []),
    },
  });

  return NextResponse.json({ client });
}
