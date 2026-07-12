import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/clients/measurement — add a measurement (stored as CheckIn)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, date, weight, waist, hips, chest, arm, thigh, calf, notes } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  // Build a descriptive note from the measurement fields
  const parts: string[] = [];
  if (weight) parts.push(`Peso: ${weight} kg`);
  if (waist) parts.push(`Vita: ${waist} cm`);
  if (hips) parts.push(`Fianchi: ${hips} cm`);
  if (chest) parts.push(`Petto: ${chest} cm`);
  if (arm) parts.push(`Braccio: ${arm} cm`);
  if (thigh) parts.push(`Coscia: ${thigh} cm`);
  if (calf) parts.push(`Polpaccio: ${calf} cm`);

  const checkIn = await prisma.checkIn.create({
    data: {
      clientId,
      weightKg: weight || null,
      notes: notes || parts.join(" | ") || undefined,
      source: "MANUAL",
      createdAt: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json({ checkIn });
}
