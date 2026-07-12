import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/exercises/[id] — delete an exercise
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.exercise.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/exercises/[id] — update an exercise
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const exercise = await prisma.exercise.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.muscleGroup !== undefined && { muscleGroup: body.muscleGroup }),
      ...(body.equipment !== undefined && { equipment: body.equipment }),
      ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
      ...(body.substitutionGroup !== undefined && { substitutionGroup: body.substitutionGroup }),
    },
  });
  return NextResponse.json({ exercise });
}
