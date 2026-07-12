/**
 * lib/training-engine.ts
 * Deterministic progressive-overload engine.
 *
 * Design principle (same as nutrition-engine.ts):
 * The LLM is never the source of truth on load/volume math.
 * Deterministic code computes recommendations; the model is only used
 * for personalized coaching notes — never for the load/volume math itself.
 */

import type { PrismaClient, SessionLog, WorkoutSessionExercise, Exercise } from "@prisma/client";

// --- Types -------------------------------------------------------------------

export interface LoadRecommendation {
  exerciseId: string;
  exerciseName: string;
  currentTargetSets: number;
  currentTargetRepsMin: number;
  currentTargetRepsMax: number;
  currentTargetWeightKg: number | null;
  recommendedWeightKg: number | null;
  recommendedRepsMin: number;
  recommendedRepsMax: number;
  adjustmentType: "INCREASE" | "MAINTAIN" | "DECREASE" | "SUBSTITUTE";
  adjustmentReason: string;
  painFlag: boolean;
}

export interface SessionAnalysis {
  sessionId: string;
  exercises: LoadRecommendation[];
  needsTrainerReview: boolean;
  reviewReasons: string[];
}

// --- Constants -------------------------------------------------------------------

const RPE_THRESHOLD_LOW = 5; // RPE consistently below this → deload
const RPE_THRESHOLD_HIGH = 9; // RPE consistently at/above this with full reps → increase
const LOAD_INCREMENT_KG = 2.5; // standard increment
const LOAD_DECREMENT_KG = 2.5;
const MAX_AUTONOMOUS_INCREASE_PCT = 0.10; // max 10% increase per cycle
const REPS_AT_TOP_OF_RANGE_COUNT = 3; // need 3+ sessions hitting top reps to increase

// --- Core Functions -------------------------------------------------------------------

/**
 * Analyze recent session logs for an exercise and recommend load adjustment.
 */
export function analyzeExerciseProgress(
  logs: Pick<SessionLog, "reps" | "weightKg" | "rpe" | "painFlag" | "loggedAt">[],
  current: Pick<WorkoutSessionExercise, "targetSets" | "targetRepsMin" | "targetRepsMax"> & {
    exercise: Pick<Exercise, "id" | "name" | "substitutionGroup">;
    exerciseId: string;
  },
  currentWeightKg: number | null,
): LoadRecommendation {
  const exercise = current.exercise;
  const sorted = [...logs].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
  );

  // Safety: if any pain flag → hard escalate, no auto-adjustment
  const hasPainFlag = sorted.some((l) => l.painFlag);
  if (hasPainFlag) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      currentTargetSets: current.targetSets,
      currentTargetRepsMin: current.targetRepsMin,
      currentTargetRepsMax: current.targetRepsMax,
      currentTargetWeightKg: currentWeightKg,
      recommendedWeightKg: currentWeightKg,
      recommendedRepsMin: current.targetRepsMin,
      recommendedRepsMax: current.targetRepsMax,
      adjustmentType: "MAINTAIN",
      adjustmentReason: "Pain flag registrato — mantenere carico attuale, escalation al trainer.",
      painFlag: true,
    };
  }

  // Not enough data → maintain
  if (sorted.length < 2) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      currentTargetSets: current.targetSets,
      currentTargetRepsMin: current.targetRepsMin,
      currentTargetRepsMax: current.targetRepsMax,
      currentTargetWeightKg: currentWeightKg,
      recommendedWeightKg: currentWeightKg,
      recommendedRepsMin: current.targetRepsMin,
      recommendedRepsMax: current.targetRepsMax,
      adjustmentType: "MAINTAIN",
      adjustmentReason: "Dati insufficienti per raccomandazione — mantenere carico attuale.",
      painFlag: false,
    };
  }

  // Analyze recent RPE trend (last 3 sessions)
  const recentLogs = sorted.slice(-3);
  const avgRpe =
    recentLogs.reduce((sum, l) => sum + (l.rpe ?? 7), 0) / recentLogs.length;

  // Count sessions where reps hit top of range
  const topRepsCount = recentLogs.filter(
    (l) => l.reps >= current.targetRepsMax,
  ).length;

  // Count sessions where reps were below minimum
  const missedRepsCount = recentLogs.filter(
    (l) => l.reps < current.targetRepsMin,
  ).length;

  // Decision logic
  if (missedRepsCount >= 2) {
    // Consistently missing reps → deload
    const newWeight =
      currentWeightKg != null
        ? Math.max(0, currentWeightKg - LOAD_DECREMENT_KG)
        : null;
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      currentTargetSets: current.targetSets,
      currentTargetRepsMin: current.targetRepsMin,
      currentTargetRepsMax: current.targetRepsMax,
      currentTargetWeightKg: currentWeightKg,
      recommendedWeightKg: newWeight,
      recommendedRepsMin: current.targetRepsMin,
      recommendedRepsMax: current.targetRepsMax,
      adjustmentType: "DECREASE",
      adjustmentReason: `Reps mancate in ${missedRepsCount}/3 sessioni recenti — ridurre carico di ${LOAD_DECREMENT_KG}kg.`,
      painFlag: false,
    };
  }

  if (topRepsCount >= REPS_AT_TOP_OF_RANGE_COUNT && avgRpe >= RPE_THRESHOLD_HIGH) {
    // Consistently hitting top reps with high RPE → increase load
    if (currentWeightKg == null) {
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        currentTargetSets: current.targetSets,
        currentTargetRepsMin: current.targetRepsMin,
        currentTargetRepsMax: current.targetRepsMax,
        currentTargetWeightKg: null,
        recommendedWeightKg: null,
        recommendedRepsMin: current.targetRepsMin,
        recommendedRepsMax: current.targetRepsMax,
        adjustmentType: "MAINTAIN",
        adjustmentReason: "Raggiunto il top delle ripetizioni ma nessun peso registrato — impossibile aumentare.",
        painFlag: false,
      };
    }
    const maxIncrease = currentWeightKg * MAX_AUTONOMOUS_INCREASE_PCT;
    const increase = Math.min(LOAD_INCREMENT_KG, maxIncrease);
    const newWeight = Math.round((currentWeightKg + increase) * 2) / 2; // round to 0.5
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      currentTargetSets: current.targetSets,
      currentTargetRepsMin: current.targetRepsMin,
      currentTargetRepsMax: current.targetRepsMax,
      currentTargetWeightKg: currentWeightKg,
      recommendedWeightKg: newWeight,
      recommendedRepsMin: current.targetRepsMin,
      recommendedRepsMax: current.targetRepsMax,
      adjustmentType: "INCREASE",
      adjustmentReason: `Top reps in ${topRepsCount}/3 sessioni con RPE medio ${avgRpe.toFixed(1)} — aumentare di ${increase}kg.`,
      painFlag: false,
    };
  }

  if (avgRpe < RPE_THRESHOLD_LOW) {
    // RPE too low → might need more volume or load
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      currentTargetSets: current.targetSets,
      currentTargetRepsMin: current.targetRepsMin,
      currentTargetRepsMax: current.targetRepsMax,
      currentTargetWeightKg: currentWeightKg,
      recommendedWeightKg: currentWeightKg,
      recommendedRepsMin: current.targetRepsMin,
      recommendedRepsMax: current.targetRepsMax,
      adjustmentType: "MAINTAIN",
      adjustmentReason: `RPE medio ${avgRpe.toFixed(1)} — soglia troppo bassa, considerare aumento volume o intensità.`,
      painFlag: false,
    };
  }

  // Default: maintain
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    currentTargetSets: current.targetSets,
    currentTargetRepsMin: current.targetRepsMin,
    currentTargetRepsMax: current.targetRepsMax,
    currentTargetWeightKg: currentWeightKg,
    recommendedWeightKg: currentWeightKg,
    recommendedRepsMin: current.targetRepsMin,
    recommendedRepsMax: current.targetRepsMax,
    adjustmentType: "MAINTAIN",
    adjustmentReason: "Progresso nella norma — mantenere carico attuale.",
    painFlag: false,
  };
}

/**
 * Analyze a full workout session and return recommendations for all exercises.
 */
export async function analyzeSession(
  prisma: PrismaClient,
  workoutSessionId: string,
): Promise<SessionAnalysis> {
  const session = await prisma.workoutSession.findUnique({
    where: { id: workoutSessionId },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { orderIndex: "asc" },
      },
      logs: {
        orderBy: { loggedAt: "desc" },
      },
    },
  });

  if (!session) {
    throw new Error(`Workout session ${workoutSessionId} not found`);
  }

  const recommendations: LoadRecommendation[] = [];
  const reviewReasons: string[] = [];

  for (const se of session.exercises) {
    // Get logs for this specific exercise across all sessions for this client
    const planClient = await prisma.workoutPlan.findUnique({
      where: { id: session.workoutPlanId },
      select: { clientId: true },
    });

    if (!planClient) continue;

    // Get all session IDs for this client's workout plans
    const clientPlans = await prisma.workoutPlan.findMany({
      where: { clientId: planClient.clientId },
      select: { sessions: { select: { id: true } } },
    });
    const sessionIds = clientPlans.flatMap((p) => p.sessions.map((s) => s.id));

    const exerciseLogs = await prisma.sessionLog.findMany({
      where: {
        workoutSessionId: { in: sessionIds },
        exerciseId: se.exerciseId,
      },
      orderBy: { loggedAt: "desc" },
      take: 10,
    });

    // Use the last logged weight as current weight
    const lastWeight =
      exerciseLogs.length > 0 ? exerciseLogs[0].weightKg : null;

    const rec = analyzeExerciseProgress(
      exerciseLogs.map((l) => ({
        reps: l.reps,
        weightKg: l.weightKg,
        rpe: l.rpe,
        painFlag: l.painFlag,
        loggedAt: l.loggedAt,
      })),
      {
        targetSets: se.targetSets,
        targetRepsMin: se.targetRepsMin,
        targetRepsMax: se.targetRepsMax,
        exercise: se.exercise,
        exerciseId: se.exerciseId,
      },
      lastWeight,
    );

    recommendations.push(rec);

    if (rec.painFlag) {
      reviewReasons.push(`${rec.exerciseName}: pain flag — escalation obbligatoria.`);
    }
    if (rec.adjustmentType === "INCREASE" || rec.adjustmentType === "DECREASE") {
      reviewReasons.push(
        `${rec.exerciseName}: ${rec.adjustmentType} raccomandato — ${rec.adjustmentReason}`,
      );
    }
  }

  return {
    sessionId: workoutSessionId,
    exercises: recommendations,
    needsTrainerReview: reviewReasons.length > 0,
    reviewReasons,
  };
}

/**
 * Apply a load recommendation to a session exercise (trainer-approved).
 */
export async function applyRecommendation(
  prisma: PrismaClient,
  workoutSessionExerciseId: string,
  rec: LoadRecommendation,
) {
  // Safety: never auto-apply if pain flag
  if (rec.painFlag) {
    throw new Error("Cannot auto-apply recommendation with pain flag — must escalate to trainer.");
  }

  const updateData: Record<string, unknown> = {};

  if (rec.adjustmentType === "INCREASE" && rec.recommendedWeightKg != null) {
    // For next session, update the target weight
    // This updates the session exercise for the NEXT session
    updateData.targetRepsMin = rec.recommendedRepsMin;
    updateData.targetRepsMax = rec.recommendedRepsMax;
  } else if (rec.adjustmentType === "DECREASE" && rec.recommendedWeightKg != null) {
    updateData.targetRepsMin = rec.recommendedRepsMin;
    updateData.targetRepsMax = rec.recommendedRepsMax;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.workoutSessionExercise.update({
      where: { id: workoutSessionExerciseId },
      data: updateData,
    });
  }
}
