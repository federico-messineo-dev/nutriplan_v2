"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Sidebar } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import {
  Dumbbell,
  Search,
  Calendar,
  ArrowRight,
  CheckCircle,
  Clock,
  Archive,
  Activity,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface WorkoutSession {
  id: string;
  dayOfWeek: number;
  name: string;
  exerciseCount: number;
  logCount: number;
}

interface WorkoutPlan {
  id: string;
  clientId: string;
  clientName: string;
  weekStart: string;
  status: string;
  generatedBy: string;
  approvedByTrainerAt: string | null;
  sessionCount: number;
  totalExercises: number;
  sessions: WorkoutSession[];
  createdAt: string;
}

const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  DRAFT: { label: "Bozza", icon: Clock, color: "bg-amber-500/20 text-amber-400 border-amber-500/50" },
  ACTIVE: { label: "Attivo", icon: CheckCircle, color: "bg-green-500/20 text-green-400 border-green-500/50" },
  ARCHIVED: { label: "Archiviato", icon: Archive, color: "bg-slate-500/20 text-slate-400 border-slate-500/50" },
};

export default function WorkoutsPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [genClientId, setGenClientId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [clients, setClients] = useState<{ id: string; fullName: string }[]>([]);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchWithTimeout("/api/clients")
      .then((r) => r.ok ? r.json() : { clients: [] })
      .then((d) => setClients(d.clients || []))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!genClientId) return;
    setGenerating(true);
    setGenMessage(null);
    try {
      const r = await fetchWithTimeout("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: genClientId, type: "workout" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Errore");
      setGenMessage("Scheda generata con successo!");
      fetchPlans();
    } catch (err) {
      setGenMessage(err instanceof Error ? err.message : "Errore di generazione");
    } finally {
      setGenerating(false);
    }
  };

  const fetchPlans = useCallback(async () => {
    setLoadError(null);
    try {
      const r = await fetchWithTimeout("/api/workouts");
      if (!r.ok) throw new Error(`API error: ${r.status}`);
      const d = await r.json();
      setPlans(d.plans || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Errore di connessione");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const filtered = plans.filter((p) => {
    const matchesSearch = p.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const hasActiveFilters = search || filterStatus !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setFilterStatus("ALL");
  };

  const activePlans = plans.filter((p) => p.status === "ACTIVE").length;
  const draftPlans = plans.filter((p) => p.status === "DRAFT").length;

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-4 md:p-6 mobile-bottom-pad">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex-1">
                <motion.h1
                  initial={{ y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springSoft}
                  className="font-display text-3xl text-slate-100 text-center"
                >
                  Allenamenti
                </motion.h1>
                <motion.p
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="font-body text-slate-400 mt-1 text-center"
                >
                  {activePlans} attivi · {draftPlans} bozze · {plans.length} totali
                </motion.p>
              </div>
            </div>

            {/* AI Generate */}
            <motion.div
              initial={{ y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row gap-3 mb-4 justify-center items-center p-3 rounded-[var(--radius-md)] bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-cyan-500/10"
            >
              <Sparkles size={16} className="text-cyan-400 shrink-0" />
              <select
                value={genClientId}
                onChange={(e) => { setGenClientId(e.target.value); setGenMessage(null); }}
                className="flex-1 max-w-xs h-9 px-3 rounded-full bg-slate-800/60 border border-slate-700/40 text-sm font-body text-slate-200 outline-none hover:border-cyan-500/30 transition-colors"
              >
                <option value="">Seleziona cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </select>
              <button
                onClick={handleGenerate}
                disabled={!genClientId || generating}
                className="h-9 px-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-medium disabled:opacity-40 hover:from-cyan-400 hover:to-blue-400 transition-all flex items-center gap-1.5"
              >
                <Sparkles size={12} />
                {generating ? "Generando..." : "Genera scheda AI"}
              </button>
              {genMessage && (
                <p className="text-xs font-mono text-slate-400 text-center sm:text-left">
                  {genMessage}
                </p>
              )}
            </motion.div>

            {/* Search + Filters */}
            <motion.div
              initial={{ y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3 mb-6 justify-center items-center"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-slate-900/50 border border-slate-700/50 flex-1 max-w-md">
                <Search size={16} className="text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca per cliente..."
                  className="flex-1 bg-transparent text-sm font-body text-slate-100 outline-none placeholder:text-slate-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 px-3 rounded-full bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 text-sm font-body text-slate-300 outline-none hover:border-cyan-500/30 transition-colors"
                >
                  <option value="ALL">Tutti gli stati</option>
                  <option value="DRAFT">Bozza</option>
                  <option value="ACTIVE">Attivo</option>
                  <option value="ARCHIVED">Archiviato</option>
                </select>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="h-9 px-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-colors flex items-center gap-1"
                  >
                    <X size={12} />
                    Reset
                  </button>
                )}
              </div>
            </motion.div>

            {/* Result count */}
            {hasActiveFilters && (
              <motion.p
                animate={{ opacity: 1 }}
                className="text-center text-sm text-slate-500 mb-4"
              >
                {filtered.length} di {plans.length} {plans.length === 1 ? "piano" : "piani"}
              </motion.p>
            )}

            {/* Workout plans list */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton width="40%" height={20} className="mb-2" />
                        <Skeleton width="25%" height={14} />
                      </div>
                      <Skeleton width={80} height={32} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : loadError ? (
              <div className="text-center py-16">
                <AlertTriangle size={48} className="mx-auto text-red-400 mb-3" />
                <h3 className="font-display text-lg text-slate-200 mb-1">Errore di caricamento</h3>
                <p className="font-body text-sm text-slate-400 max-w-xs mx-auto mb-4">{loadError}</p>
                <button
                  onClick={fetchPlans}
                  className="font-body text-xs text-cyan-400 underline hover:text-cyan-300"
                >
                  Riprova
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Dumbbell size={48} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-display text-lg text-slate-200 mb-1">
                  {plans.length === 0 ? "Nessun allenamento" : "Nessun risultato"}
                </h3>
                <p className="font-body text-sm text-slate-400 max-w-xs mx-auto">
                  {plans.length === 0
                    ? "I piani di allenamento appariranno qui quando vengono creati."
                    : "Prova a modificare i filtri di ricerca."}
                </p>
              </motion.div>
            ) : (
              <StaggerList className="space-y-3">
                {filtered.map((plan) => {
                  const StatusIcon = statusConfig[plan.status]?.icon || Clock;
                  const weekDate = new Date(plan.weekStart).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <StaggerItem key={plan.id}>
                      <Link href={`/dashboard/clients/${plan.clientId}`}>
                        <Card variant="interactive" className="p-5 group">
                          <div className="flex items-center gap-4">
                            {/* Status icon */}
                            <div
                              className={cn(
                                "w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0",
                                plan.status === "ACTIVE"
                                  ? "bg-green-500/20"
                                  : plan.status === "DRAFT"
                                    ? "bg-amber-500/20"
                                    : "bg-slate-500/20",
                              )}
                            >
                              <StatusIcon
                                size={18}
                                className={
                                  plan.status === "ACTIVE"
                                    ? "text-green-400"
                                    : plan.status === "DRAFT"
                                      ? "text-amber-400"
                                      : "text-slate-400"
                                }
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-body text-sm font-medium text-slate-100 truncate">
                                  {plan.clientName}
                                </h3>
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-body border",
                                    statusConfig[plan.status]?.color,
                                  )}
                                >
                                  {statusConfig[plan.status]?.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-meta text-[10px] text-slate-500 flex items-center gap-1">
                                  <Calendar size={10} />
                                  Settimana del {weekDate}
                                </span>
                                <span className="font-mono text-[10px] text-slate-600">
                                  {plan.sessionCount} sessioni · {plan.totalExercises} esercizi
                                </span>
                              </div>
                            </div>

                            {/* Session chips */}
                            <div className="hidden md:flex items-center gap-1.5">
                              {plan.sessions.map((s) => (
                                <div
                                  key={s.id}
                                  className={cn(
                                    "px-2 py-1 rounded-full text-[10px] font-mono border",
                                    s.logCount > 0
                                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                                      : "bg-slate-800/50 border-slate-700/50 text-slate-500",
                                  )}
                                  title={`${s.name}: ${s.exerciseCount} esercizi, ${s.logCount} log`}
                                >
                                  {dayNames[s.dayOfWeek]}
                                </div>
                              ))}
                            </div>

                            <ArrowRight
                              size={16}
                              className="text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0"
                            />
                          </div>
                        </Card>
                      </Link>
                    </StaggerItem>
                  );
                })}
              </StaggerList>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
