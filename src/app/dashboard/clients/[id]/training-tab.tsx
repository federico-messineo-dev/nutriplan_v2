"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/cn";
import {
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Check,
  RefreshCw,
  Send,
} from "lucide-react";
import { WorkoutPDFDownload } from "@/components/workout-pdf";

interface LoadRecommendation {
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

interface SessionAnalysis {
  sessionId: string;
  exercises: LoadRecommendation[];
  needsTrainerReview: boolean;
  reviewReasons: string[];
}

interface WorkoutSession {
  id: string;
  dayOfWeek: number;
  name: string;
  exercises: {
    id: string;
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
    exercise: { name: string; muscleGroup: string };
  }[];
}

interface WorkoutPlan {
  id: string;
  weekStart: string;
  status: string;
  sessions: WorkoutSession[];
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

export function TrainingTab({ clientId }: { clientId: string }) {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        const data = await res.json();
        // Workout plans aren't included in the client API yet — stub for now
        setPlans(data.client?.workoutPlans || []);
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clientId]);

  const analyzeSession = async (sessionId: string) => {
    setAnalyzing(true);
    setSelectedSession(sessionId);
    try {
      const res = await fetch("/api/training/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutSessionId: sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch {
      // silently fail
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-slate-800/50 rounded-[var(--radius-md)] animate-pulse" />
        ))}
      </div>
    );
  }

  // No workout plans yet
  if (plans.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Dumbbell size={48} className="mx-auto mb-4 text-slate-600" />
        <h3 className="font-display text-lg text-slate-200 mb-2">Nessun piano di allenamento</h3>
        <p className="font-body text-sm text-slate-400">
          Crea un piano di allenamento per questo cliente per iniziare a tracciare
          il sovraccarico progressivo.
        </p>
      </div>
    );
  }

  const latestPlan = plans[0];

  const handleSendPDF = async () => {
    const { pdf } = await import("@react-pdf/renderer");
    const { WorkoutPDF } = await import("@/components/workout-pdf");
    const blob = await pdf(
      <WorkoutPDF
        data={{
          clientName: "Cliente",
          weekStart: latestPlan.weekStart,
          sessions: latestPlan.sessions.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            name: s.name,
            exercises: s.exercises.map((e) => ({
              name: e.exercise.name,
              muscleGroup: e.exercise.muscleGroup,
              targetSets: e.targetSets,
              targetRepsMin: e.targetRepsMin,
              targetRepsMax: e.targetRepsMax,
            })),
          })),
        }}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(`https://wa.me/?text=${encodeURIComponent("Ecco il tuo piano di allenamento NutriPlan 💪")}&url=${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Plan info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg text-slate-100">
            Piano settimanale
          </h3>
          <p className="font-meta text-slate-500 text-xs">
            {new Date(latestPlan.weekStart).toLocaleDateString("it-IT")} — {latestPlan.status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WorkoutPDFDownload
            data={{
              clientName: "Cliente",
              weekStart: latestPlan.weekStart,
              sessions: latestPlan.sessions.map((s) => ({
                dayOfWeek: s.dayOfWeek,
                name: s.name,
                exercises: s.exercises.map((e) => ({
                  name: e.exercise.name,
                  muscleGroup: e.exercise.muscleGroup,
                  targetSets: e.targetSets,
                  targetRepsMin: e.targetRepsMin,
                  targetRepsMax: e.targetRepsMax,
                })),
              })),
            }}
          />
          <button
            onClick={handleSendPDF}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] bg-cyan-500/10 border border-cyan-500/30 text-xs font-body text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            <Send size={12} />
            Invia PDF
          </button>
        </div>
      </div>

      {/* Sessions grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {latestPlan.sessions.map((session) => (
          <motion.button
            key={session.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSoft}
            onClick={() => analyzeSession(session.id)}
            className={cn(
              "text-left p-4 rounded-[var(--radius-md)] border transition-all",
              selectedSession === session.id
                ? "bg-cyan-500/10 border-cyan-500/30"
                : "bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-cyan-400">
                {DAY_NAMES[session.dayOfWeek]}
              </span>
              <span className="font-body text-sm font-medium text-slate-100">
                {session.name}
              </span>
            </div>
            <div className="space-y-1">
              {session.exercises.map((se) => (
                <div key={se.id} className="flex items-center justify-between text-xs">
                  <span className="font-body text-slate-400 truncate">{se.exercise.name}</span>
                  <span className="font-mono text-slate-500">
                    {se.targetSets}×{se.targetRepsMin}-{se.targetRepsMax}
                  </span>
                </div>
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Analysis results */}
      {analyzing && (
        <div className="text-center py-8">
          <RefreshCw size={20} className="animate-spin mx-auto text-cyan-400 mb-2" />
          <p className="font-body text-xs text-slate-400">Analisi in corso...</p>
        </div>
      )}

      {analysis && !analyzing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
          className="space-y-4"
        >
          {/* Review banner */}
          {analysis.needsTrainerReview && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius-md)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <span className="font-body text-sm font-medium text-amber-400">
                  Richiede revisione
                </span>
              </div>
              <ul className="space-y-1">
                {analysis.reviewReasons.map((reason, i) => (
                  <li key={i} className="font-body text-xs text-amber-400/80">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exercise recommendations */}
          <div className="space-y-3">
            {analysis.exercises.map((rec) => (
              <div
                key={rec.exerciseId}
                className={cn(
                  "bg-slate-900/50 border rounded-[var(--radius-md)] p-4",
                  rec.painFlag
                    ? "border-red-500/30"
                    : rec.adjustmentType === "INCREASE"
                      ? "border-green-500/30"
                      : rec.adjustmentType === "DECREASE"
                        ? "border-amber-500/30"
                        : "border-slate-700/50",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-medium text-slate-100">
                      {rec.exerciseName}
                    </span>
                    {rec.painFlag && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] font-body">
                        <AlertTriangle size={10} />
                        PAIN
                      </span>
                    )}
                  </div>
                  <AdjustmentBadge type={rec.adjustmentType} />
                </div>

                <p className="font-body text-xs text-slate-400 mb-3">
                  {rec.adjustmentReason}
                </p>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="font-meta text-slate-600">Attuale</span>
                    <p className="font-mono text-slate-200">
                      {rec.currentTargetWeightKg != null
                        ? `${rec.currentTargetWeightKg}kg`
                        : "—"}{" "}
                      {rec.currentTargetSets}×{rec.currentTargetRepsMin}-{rec.currentTargetRepsMax}
                    </p>
                  </div>
                  {(rec.adjustmentType === "INCREASE" || rec.adjustmentType === "DECREASE") && (
                    <div>
                      <span className="font-meta text-slate-600">Prossimo</span>
                      <p className={cn(
                        "font-mono",
                        rec.adjustmentType === "INCREASE" ? "text-green-400" : "text-amber-400",
                      )}>
                        {rec.recommendedWeightKg != null
                          ? `${rec.recommendedWeightKg}kg`
                          : "—"}{" "}
                        {rec.currentTargetSets}×{rec.recommendedRepsMin}-{rec.recommendedRepsMax}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function AdjustmentBadge({ type }: { type: string }) {
  const config = {
    INCREASE: { icon: TrendingUp, label: "Aumenta", color: "text-green-400 bg-green-500/20 border-green-500/50" },
    DECREASE: { icon: TrendingDown, label: "Riduci", color: "text-amber-400 bg-amber-500/20 border-amber-500/50" },
    MAINTAIN: { icon: Minus, label: "Mantieni", color: "text-slate-400 bg-slate-800/50 border-slate-700/50" },
    SUBSTITUTE: { icon: RefreshCw, label: "Sostituisci", color: "text-cyan-400 bg-cyan-500/20 border-cyan-500/50" },
  } as Record<string, { icon: React.ComponentType<{ size?: number }>; label: string; color: string }>;

  const c = config[type] || config.MAINTAIN;
  const Icon = c.icon;

  return (
    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body border", c.color)}>
      <Icon size={10} />
      {c.label}
    </span>
  );
}
