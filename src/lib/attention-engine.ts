/**
 * lib/attention-engine.ts
 * Computes a "needs attention" score for each active client.
 * Used by the Coach Command Center dashboard.
 *
 * Signals:
 * - Missed check-in streak (days since last check-in)
 * - Declining adherence trend
 * - Weight stall despite reported adherence
 * - Low energy / high stress reports
 *
 * Score 0-100: higher = needs more attention.
 */

import type { PrismaClient, CheckIn, Client } from "@prisma/client";

export interface ClientAttentionScore {
  clientId: string;
  clientName: string;
  score: number;
  signals: string[];
  lastCheckInDays: number | null;
  weightTrend: "UP" | "DOWN" | "STABLE" | "UNKNOWN";
  adherenceAvg: number | null;
}

/**
 * Compute attention scores for all active clients of a trainer.
 */
export async function computeAttentionScores(
  prisma: PrismaClient,
  trainerId: string,
): Promise<ClientAttentionScore[]> {
  const clients = await prisma.client.findMany({
    where: { trainerId, status: "ACTIVE" },
    include: {
      checkIns: {
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });

  const scores: ClientAttentionScore[] = [];

  for (const client of clients) {
    const score = computeClientScore(client);
    scores.push(score);
  }

  // Sort by score descending (highest attention first)
  return scores.sort((a, b) => b.score - a.score);
}

function computeClientScore(
  client: Client & { checkIns: CheckIn[] },
): ClientAttentionScore {
  let score = 0;
  const signals: string[] = [];
  const sorted = [...client.checkIns].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // 1. Missed check-in streak
  let lastCheckInDays: number | null = null;
  if (sorted.length > 0) {
    const last = new Date(sorted[0].createdAt);
    const now = new Date();
    lastCheckInDays = Math.floor(
      (now.getTime() - last.getTime()) / (86_400_000),
    );

    if (lastCheckInDays > 14) {
      score += 40;
      signals.push(`Nessun check-in da ${lastCheckInDays} giorni`);
    } else if (lastCheckInDays > 7) {
      score += 20;
      signals.push(`Ultimo check-in ${lastCheckInDays} giorni fa`);
    }
  } else {
    score += 50;
    signals.push("Mai fatto check-in");
    lastCheckInDays = null;
  }

  // 2. Adherence trend
  const adherenceValues = sorted
    .filter((c) => c.adherencePct != null)
    .map((c) => c.adherencePct!);

  let adherenceAvg: number | null = null;
  if (adherenceValues.length >= 2) {
    adherenceAvg =
      adherenceValues.reduce((a, b) => a + b, 0) / adherenceValues.length;

    // Check if declining (last 2 vs first 2)
    const firstHalf = adherenceValues.slice(
      Math.floor(adherenceValues.length / 2),
    );
    const secondHalf = adherenceValues.slice(
      0,
      Math.floor(adherenceValues.length / 2),
    );
    const avgFirst =
      firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond =
      secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (avgFirst < avgSecond - 15) {
      score += 25;
      signals.push(
        `Aderenza in calo: ${Math.round(avgFirst)}% → ${Math.round(avgSecond)}%`,
      );
    } else if (adherenceAvg < 60) {
      score += 15;
      signals.push(`Aderenza bassa: ${Math.round(adherenceAvg)}%`);
    }
  }

  // 3. Weight stall despite adherence
  const weightChecks = sorted
    .filter((c) => c.weightKg != null)
    .map((c) => ({
      weight: c.weightKg!,
      date: c.createdAt,
      adherence: c.adherencePct ?? 100,
    }));

  let weightTrend: "UP" | "DOWN" | "STABLE" | "UNKNOWN" = "UNKNOWN";

  if (weightChecks.length >= 4) {
    const recent = weightChecks.slice(0, 4);
    const weights = recent.map((w) => w.weight);
    const first = weights[weights.length - 1];
    const last = weights[0];
    const diff = last - first;
    const avgAdherence =
      recent.reduce((s, w) => s + w.adherence, 0) / recent.length;

    if (Math.abs(diff) < 0.5) {
      weightTrend = "STABLE";
      // Stall with high adherence → might need intervention
      if (avgAdherence > 80 && client.goal !== "MAINTAIN") {
        score += 15;
        signals.push(
          `Peso stallo (${diff.toFixed(1)}kg) nonostante aderenza ${Math.round(avgAdherence)}%`,
        );
      }
    } else if (diff > 0) {
      weightTrend = "UP";
      // Weight going up during cut → concern
      if (client.goal === "CUT" && diff > 1) {
        score += 20;
        signals.push(`Peso in aumento (+${diff.toFixed(1)}kg) durante cut`);
      }
    } else {
      weightTrend = "DOWN";
    }
  }

  // 4. Low energy / high stress
  const recentWithVitals = sorted.filter(
    (c) => c.energyLevel != null || c.stressLevel != null,
  );
  if (recentWithVitals.length > 0) {
    const avgEnergy =
      recentWithVitals.reduce((s, c) => s + (c.energyLevel ?? 5), 0) /
      recentWithVitals.length;
    const avgStress =
      recentWithVitals.reduce((s, c) => s + (c.stressLevel ?? 5), 0) /
      recentWithVitals.length;

    if (avgEnergy < 4) {
      score += 10;
      signals.push(`Energia media bassa: ${avgEnergy.toFixed(1)}/10`);
    }
    if (avgStress > 7) {
      score += 10;
      signals.push(`Stress medio alto: ${avgStress.toFixed(1)}/10`);
    }
  }

  // Cap at 100
  score = Math.min(100, score);

  return {
    clientId: client.id,
    clientName: client.fullName,
    score,
    signals,
    lastCheckInDays,
    weightTrend,
    adherenceAvg,
  };
}
