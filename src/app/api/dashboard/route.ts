import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerId } from "@/lib/auth";
import { computeAttentionScores } from "@/lib/attention-engine";

// GET /api/dashboard — get trainer dashboard data with attention scores
export async function GET() {
  const trainerId = getTrainerId();

  // Get attention scores for all active clients
  const attentionScores = await computeAttentionScores(prisma, trainerId);

  // Get summary stats
  const totalClients = await prisma.client.count({
    where: { trainerId },
  });
  const activeClients = await prisma.client.count({
    where: { trainerId, status: "ACTIVE" },
  });
  const totalCheckIns = await prisma.checkIn.count({
    where: { client: { trainerId } },
  });
  const totalPlans = await prisma.dietPlan.count({
    where: { client: { trainerId } },
  });

  return NextResponse.json({
    attentionScores,
    stats: {
      totalClients,
      activeClients,
      totalCheckIns,
      totalPlans,
    },
  });
}
