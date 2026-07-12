import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerId } from "@/lib/auth";

// GET /api/settings — get trainer profile
export async function GET() {
  const trainerId = getTrainerId();

  const trainer = await prisma.trainer.findUnique({
    where: { id: trainerId },
    include: {
      _count: { select: { clients: true, recipes: true, exercises: true } },
    },
  });

  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  return NextResponse.json({
    trainer: {
      id: trainer.id,
      email: trainer.email,
      fullName: trainer.fullName,
      businessName: trainer.businessName,
      createdAt: trainer.createdAt,
      clientCount: trainer._count.clients,
      alimentCount: trainer._count.recipes,
      exerciseCount: trainer._count.exercises,
    },
  });
}

// PATCH /api/settings — update trainer profile
export async function PATCH(req: NextRequest) {
  const trainerId = getTrainerId();
  const body = await req.json();

  const trainer = await prisma.trainer.update({
    where: { id: trainerId },
    data: {
      ...(body.fullName !== undefined && { fullName: body.fullName }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.businessName !== undefined && { businessName: body.businessName }),
    },
  });

  return NextResponse.json({ trainer });
}
