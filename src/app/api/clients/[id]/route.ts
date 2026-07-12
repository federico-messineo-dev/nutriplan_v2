import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clients/[id] — get a single client with all relations
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      checkIns: { orderBy: { createdAt: "desc" } },
      dietPlans: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { meals: true },
      },
      _count: { select: { checkIns: true, dietPlans: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
}

// PATCH /api/clients/[id] — update client profile
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  // Build update data dynamically
  const data: Record<string, unknown> = {};

  if (body.fullName !== undefined) data.fullName = body.fullName;
  if (body.phoneNumberE164 !== undefined) data.phoneNumberE164 = body.phoneNumberE164;
  if (body.email !== undefined) data.email = body.email;
  if (body.status !== undefined) data.status = body.status;
  if (body.sex !== undefined) data.sex = body.sex;
  if (body.age !== undefined) data.age = body.age;
  if (body.heightCm !== undefined) data.heightCm = body.heightCm;
  if (body.startWeightKg !== undefined) data.startWeightKg = body.startWeightKg;
  if (body.diet !== undefined) data.diet = body.diet;
  if (body.activityFactor !== undefined) data.activityFactor = body.activityFactor;
  if (body.goal !== undefined) data.goal = body.goal;
  if (body.trainingDaysWk !== undefined) data.trainingDaysWk = body.trainingDaysWk;
  if (body.waterTargetL !== undefined) data.waterTargetL = body.waterTargetL;
  if (body.bmrManualKcal !== undefined) data.bmrManualKcal = body.bmrManualKcal;
  if (body.tdeeManualKcal !== undefined) data.tdeeManualKcal = body.tdeeManualKcal;
  if (body.mealDistribution !== undefined) data.mealDistribution = JSON.stringify(body.mealDistribution);
  if (body.exclusions !== undefined) data.exclusions = JSON.stringify(body.exclusions);
  if (body.medicalNotes !== undefined) data.medicalNotes = body.medicalNotes;

  const client = await prisma.client.update({
    where: { id },
    data,
  });

  return NextResponse.json({ client });
}

// DELETE /api/clients/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
