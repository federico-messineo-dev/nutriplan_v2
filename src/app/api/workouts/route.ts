import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerId } from "@/lib/auth";

// GET /api/workouts — list all workout plans for the trainer's clients
export async function GET() {
  const trainerId = getTrainerId();

  const plans = await prisma.workoutPlan.findMany({
    where: { client: { trainerId } },
    include: {
      client: { select: { id: true, fullName: true } },
      sessions: {
        include: {
          exercises: {
            include: { exercise: { select: { name: true, muscleGroup: true } } },
            orderBy: { orderIndex: "asc" },
          },
          logs: { orderBy: { loggedAt: "desc" }, take: 5 },
        },
        orderBy: { dayOfWeek: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = plans.map((p) => ({
    id: p.id,
    clientId: p.clientId,
    clientName: p.client.fullName,
    weekStart: p.weekStart,
    status: p.status,
    generatedBy: p.generatedBy,
    approvedByTrainerAt: p.approvedByTrainerAt,
    sessionCount: p.sessions.length,
    totalExercises: p.sessions.reduce((sum, s) => sum + s.exercises.length, 0),
    sessions: p.sessions.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      name: s.name,
      exerciseCount: s.exercises.length,
      logCount: s.logs.length,
    })),
    createdAt: p.createdAt,
  }));

  return NextResponse.json({ plans: result });
}
