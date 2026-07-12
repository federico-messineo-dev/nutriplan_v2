import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerId } from "@/lib/auth";

// GET /api/exercises — list all exercises (global + trainer's)
export async function GET() {
  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [{ trainerId: null }, { trainerId: { not: null } }],
    },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ exercises });
}

// POST /api/exercises — create a new exercise
export async function POST(req: NextRequest) {
  const trainerId = getTrainerId();
  const body = await req.json();

  const exercise = await prisma.exercise.create({
    data: {
      trainerId,
      name: body.name,
      muscleGroup: body.muscleGroup,
      equipment: body.equipment || null,
      videoUrl: body.videoUrl || null,
      substitutionGroup: body.substitutionGroup || null,
    },
  });

  return NextResponse.json({ exercise });
}
