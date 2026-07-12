import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeSession } from "@/lib/training-engine";

// POST /api/training/analyze — analyze a workout session and return load recommendations
export async function POST(req: NextRequest) {
  const { workoutSessionId } = await req.json();

  if (!workoutSessionId) {
    return NextResponse.json(
      { error: "workoutSessionId required" },
      { status: 400 },
    );
  }

  try {
    const analysis = await analyzeSession(prisma, workoutSessionId);
    return NextResponse.json(analysis);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
