"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Pencil,
} from "lucide-react";
import Link from "next/link";

interface WeightPoint {
  date: string;
  weight: number | null;
}

interface DraftMeal {
  name: string;
  targetKcal: number;
  items: { recipeName: string; grams: number }[];
  note: string;
}

interface ReviewData {
  client: {
    id: string;
    fullName: string;
    goal: string;
    diet: string;
  };
  current: {
    bmr: number;
    tdee: number;
    previousTarget: number;
    weight: number;
  };
  recalibration: {
    previousTargetKcal: number;
    suggestedTargetKcal: number;
    deltaPct: number;
    requiresTrainerReview: boolean;
    reason: string;
  };
  macros: {
    p: number;
    c: number;
    f: number;
  };
  draftedMeals: DraftMeal[];
  weightTrend: WeightPoint[];
  checkInCount: number;
}

export default function WeeklyReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editKcal, setEditKcal] = useState(0);
  const [editP, setEditP] = useState(0);
  const [editC, setEditC] = useState(0);
  const [editF, setEditF] = useState(0);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout("/api/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load review");
      }
      const d: ReviewData = await res.json();
      setData(d);
      setEditKcal(d.recalibration.suggestedTargetKcal);
      setEditP(d.macros.p);
      setEditC(d.macros.c);
      setEditF(d.macros.f);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const handleApprove = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetchWithTimeout("/api/weekly-review/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          targetKcal: editing ? editKcal : data.recalibration.suggestedTargetKcal,
          targetProteinG: editing ? editP : data.macros.p,
          targetCarbG: editing ? editC : data.macros.c,
          targetFatG: editing ? editF : data.macros.f,
        }),
      });
      if (!res.ok) throw new Error("Errore nel salvataggio");
      setApproved(true);
      setEditing(false);
    } catch {
      setError("Errore nel salvataggio della ricalibrazione");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await fetchWithTimeout("/api/clients/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          text: `[WEEKLY_REVIEW_REJECTED] previous=${data.recalibration.previousTargetKcal}kcal suggested=${data.recalibration.suggestedTargetKcal}kcal`,
        }),
      });
      setRejected(true);
    } catch {
      setError("Errore nel rifiuto della ricalibrazione");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    if (!data) return;
    setEditKcal(data.recalibration.suggestedTargetKcal);
    setEditP(data.macros.p);
    setEditC(data.macros.c);
    setEditF(data.macros.f);
    setEditing(true);
  };

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="text-center">
          <RefreshCw size={24} className="animate-spin mx-auto text-cyan-400 mb-3" />
          <p className="font-body text-sm text-slate-400">Calcolo ricalibrazione...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={32} className="mx-auto text-amber-400 mb-3" />
          <p className="font-body text-sm text-slate-400 mb-4">{error}</p>
          <Link
            href={`/dashboard/clients/${id}`}
            className="text-cyan-400 text-sm hover:underline"
          >
            Torna al cliente
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { current, recalibration, draftedMeals, weightTrend } = data;
  const displayKcal = editing ? editKcal : recalibration.suggestedTargetKcal;
  const displayP = editing ? editP : data.macros.p;
  const displayC = editing ? editC : data.macros.c;
  const displayF = editing ? editF : data.macros.f;
  const deltaKcal = displayKcal - current.previousTarget;
  const weightDiff =
    weightTrend.length >= 2
      ? (weightTrend[weightTrend.length - 1].weight! - weightTrend[0].weight!).toFixed(1)
      : null;

  const done = approved || rejected;

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/clients/${id}`}
              className="text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-display text-xl text-slate-100">Weekly Review</h1>
              <p className="font-meta text-slate-500">{data.client.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!done && (
              <button
                onClick={() => router.refresh()}
                className="h-9 px-3 rounded-[var(--radius-sm)] bg-slate-800/50 border border-slate-700/50 text-xs font-body text-slate-400 hover:text-slate-100 transition-colors"
              >
                <RefreshCw size={12} className="inline mr-1" />
                Ricalcola
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Status banners */}
        <AnimatePresence>
          {approved && (
            <motion.div
              initial={{ y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-500/10 border border-green-500/30 rounded-[var(--radius-md)] p-4 flex items-center gap-3"
            >
              <Check size={18} className="text-green-400" />
              <div>
                <p className="font-body text-sm text-green-400 font-medium">Ricalibrazione approvata</p>
                <p className="font-body text-xs text-green-400/70 mt-0.5">
                  Nuovo piano settimanale creato con target {displayKcal} kcal.
                </p>
              </div>
            </motion.div>
          )}
          {rejected && (
            <motion.div
              initial={{ y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-[var(--radius-md)] p-4 flex items-center gap-3"
            >
              <X size={18} className="text-slate-400" />
              <div>
                <p className="font-body text-sm text-slate-300 font-medium">Ricalibrazione rifiutata</p>
                <p className="font-body text-xs text-slate-400 mt-0.5">
                  I target rimangono invariati. Note salvata per riferimento.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current state */}
        <motion.div
          initial={{ y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
          className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-6"
        >
          <h2 className="font-meta text-slate-500 mb-4">Stato attuale</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="font-meta text-slate-600 text-xs">Peso attuale</p>
              <p className="font-display text-2xl text-slate-100">{current.weight} kg</p>
              {weightDiff && (
                <p
                  className={cn(
                    "font-mono text-xs",
                    parseFloat(weightDiff) < 0 ? "text-cyan-400" : "text-green-400",
                  )}
                >
                  {parseFloat(weightDiff) > 0 ? "+" : ""}
                  {weightDiff} kg totale
                </p>
              )}
            </div>
            <div>
              <p className="font-meta text-slate-600 text-xs">BMR</p>
              <p className="font-display text-2xl text-slate-100">{current.bmr}</p>
              <p className="font-meta text-slate-600 text-xs">kcal</p>
            </div>
            <div>
              <p className="font-meta text-slate-600 text-xs">TDEE</p>
              <p className="font-display text-2xl text-slate-100">{current.tdee}</p>
              <p className="font-meta text-slate-600 text-xs">kcal</p>
            </div>
            <div>
              <p className="font-meta text-slate-600 text-xs">Target attuale</p>
              <p className="font-display text-2xl text-slate-100">{current.previousTarget}</p>
              <p className="font-meta text-slate-600 text-xs">kcal</p>
            </div>
          </div>
        </motion.div>

        {/* Weight trend */}
        {weightTrend.length > 1 && (
          <motion.div
            initial={{ y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSoft, delay: 0.1 }}
            className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-6"
          >
            <h2 className="font-meta text-slate-500 mb-4">Trend peso</h2>
            <div className="flex items-end gap-1 h-24">
              {weightTrend.map((pt, i) => {
                const weights = weightTrend
                  .filter((w) => w.weight != null)
                  .map((w) => w.weight!);
                const min = Math.min(...weights);
                const max = Math.max(...weights);
                const range = max - min || 1;
                const height = pt.weight
                  ? ((pt.weight - min) / range) * 80 + 16
                  : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-full rounded-t-sm transition-all",
                        i === weightTrend.length - 1 ? "bg-cyan-500" : "bg-slate-700",
                      )}
                      style={{ height: `${height}px` }}
                    />
                    {i === 0 || i === weightTrend.length - 1 ? (
                      <span className="font-mono text-[9px] text-slate-600">
                        {pt.weight}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recalibration proposal */}
        <motion.div
          initial={{ y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.15 }}
          className={cn(
            "bg-slate-900/50 border rounded-[var(--radius-md)] p-6",
            recalibration.requiresTrainerReview
              ? "border-amber-500/40"
              : "border-green-500/30",
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display text-lg text-slate-100">Proposta ricalibrazione</h2>
              <p className="font-body text-sm text-slate-400 mt-1">{recalibration.reason}</p>
            </div>
            <div className="flex items-center gap-2">
              {recalibration.requiresTrainerReview && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 text-xs font-body">
                  <AlertTriangle size={12} />
                  Richiede revisione
                </span>
              )}
              {!done && (
                <button
                  onClick={editing ? () => setEditing(false) : startEditing}
                  className={cn(
                    "h-9 px-3 rounded-[var(--radius-sm)] text-xs font-body transition-colors",
                    editing
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-100",
                  )}
                >
                  <Pencil size={11} className="inline mr-1" />
                  {editing ? "Annulla" : "Modifica"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-meta text-slate-600 text-xs">Attuale</p>
              <p className="font-display text-xl text-slate-100">{recalibration.previousTargetKcal}</p>
              <p className="font-meta text-slate-600 text-xs">kcal</p>
            </div>
            <div>
              <p className="font-meta text-slate-600 text-xs">→</p>
              <p
                className={cn(
                  "font-display text-xl",
                  deltaKcal > 0 ? "text-green-400" : deltaKcal < 0 ? "text-cyan-400" : "text-slate-100",
                )}
              >
                {deltaKcal > 0 ? "+" : ""}
                {Math.round(deltaKcal)}
              </p>
              <p className="font-meta text-slate-600 text-xs">kcal</p>
            </div>
            <div>
              <p className="font-meta text-slate-600 text-xs">Nuovo target</p>
              {editing ? (
                <input
                  type="number"
                  value={editKcal}
                  onChange={(e) => setEditKcal(Number(e.target.value))}
                  className="w-24 text-center font-display text-xl text-cyan-400 bg-transparent border-b-2 border-cyan-500/30 focus:border-cyan-400 outline-none py-0.5"
                />
              ) : (
                <p className="font-display text-xl text-cyan-400">{displayKcal}</p>
              )}
              <p className="font-meta text-slate-600 text-xs">kcal</p>
            </div>
          </div>

          {/* Macros — editable */}
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <p className="font-meta text-slate-500 text-xs mb-3">
              {editing ? "Modifica macro target" : "Nuovi macro target"}
            </p>
            <div className="flex gap-6">
              {[
                { label: "P", color: "text-green-400", value: displayP, setter: setEditP },
                { label: "C", color: "text-purple-400", value: displayC, setter: setEditC },
                { label: "F", color: "text-slate-300", value: displayF, setter: setEditF },
              ].map((m) => (
                <div key={m.label}>
                  <span className={cn("font-mono text-xs", m.color)}>
                    {m.label}
                  </span>{" "}
                  {editing ? (
                    <input
                      type="number"
                      value={m.value}
                      onChange={(e) => m.setter(parseInt(e.target.value) || 0)}
                      className="w-16 text-center font-display text-lg bg-transparent border-b border-slate-600 focus:border-cyan-400 outline-none py-0.5"
                    />
                  ) : (
                    <span className="font-display text-lg text-slate-100">{m.value}g</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Drafted meals */}
        <motion.div
          initial={{ y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-6"
        >
          <h2 className="font-display text-lg text-slate-100 mb-1">Piano proposto</h2>
          <p className="font-body text-xs text-slate-500 mb-4">
            Draft deterministico — sostituire con generazione AI quando il provider sarà configurato
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {draftedMeals.map((meal, i) => (
              <div
                key={i}
                className="bg-slate-800/50 rounded-[var(--radius-sm)] p-4 border border-slate-700/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-body text-sm font-medium text-slate-100">{meal.name}</h3>
                  <span className="font-mono text-[10px] text-slate-500">
                    ~{meal.targetKcal} kcal
                  </span>
                </div>
                <div className="space-y-1">
                  {meal.items.map((item, j) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <span className="font-body text-slate-400">{item.recipeName}</span>
                      <span className="font-mono text-slate-500">{item.grams}g</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        {!done && (
          <motion.div
            initial={{ y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSoft, delay: 0.25 }}
            className="flex items-center gap-3 pb-12"
          >
            <button
              onClick={handleApprove}
              disabled={saving}
              className="flex items-center gap-2 h-11 px-6 rounded-[var(--radius-sm)] text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700 transition-all disabled:opacity-50 shadow-sm shadow-cyan-500/20"
            >
              <Check size={16} />
              {saving ? "Salvataggio..." : "Approva ricalibrazione"}
            </button>
            <button
              onClick={handleReject}
              disabled={saving}
              className="h-11 px-5 rounded-[var(--radius-sm)] bg-slate-800/50 border border-slate-700/50 text-sm font-body text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <X size={14} className="inline mr-1" />
              Rifiuta
            </button>
          </motion.div>
        )}

        {/* Back link after done */}
        {done && (
          <motion.div
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="pb-12"
          >
            <Link
              href={`/dashboard/clients/${id}`}
              className="text-cyan-400 text-sm hover:underline"
            >
              ← Torna al cliente
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
