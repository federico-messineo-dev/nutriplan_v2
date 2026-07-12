"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/cn";
import {
  Users,
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowRight,
  Plus,
  AlertTriangle,
  Activity,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface AttentionScore {
  clientId: string;
  clientName: string;
  score: number;
  signals: string[];
  lastCheckInDays: number | null;
  weightTrend: "UP" | "DOWN" | "STABLE" | "UNKNOWN";
  adherenceAvg: number | null;
}

interface DashboardData {
  attentionScores: AttentionScore[];
  stats: {
    totalClients: number;
    activeClients: number;
    totalCheckIns: number;
    totalPlans: number;
  };
}

function AttentionBadge({ score }: { score: number }) {
  if (score >= 40) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] font-body">
        <AlertTriangle size={10} />
        Alta
      </span>
    );
  }
  if (score >= 20) {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 text-[10px] font-body">
        <Activity size={10} />
        Media
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/50 text-[10px] font-body">
      OK
    </span>
  );
}

function ClientCard({
  client,
  onDelete,
}: {
  client: AttentionScore;
  onDelete: (target: { id: string; name: string }) => void;
}) {
  return (
    <div className="relative group">
      <Link href={`/dashboard/clients/${client.clientId}`}>
        <Card variant="interactive" className="p-5 h-full">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-display text-lg text-slate-100">{client.clientName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <AttentionBadge score={client.score} />
                {client.lastCheckInDays != null && (
                  <span className="font-meta text-slate-500 text-xs">
                    {client.lastCheckInDays === 0
                      ? "Oggi"
                      : `${client.lastCheckInDays}g fa`}
                  </span>
                )}
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-500 mt-1" />
          </div>

          {/* Signals */}
          {client.signals.length > 0 && (
            <div className="space-y-1 mb-3">
              {client.signals.slice(0, 2).map((signal, i) => (
                <p key={i} className="font-body text-xs text-slate-400">
                  {signal}
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            {client.adherenceAvg != null && (
              <span className="font-mono text-slate-500">
                Aderenza: {Math.round(client.adherenceAvg)}%
              </span>
            )}
            <span
              className={cn(
                "font-mono",
                client.weightTrend === "DOWN"
                  ? "text-cyan-400"
                  : client.weightTrend === "UP"
                    ? "text-green-400"
                    : "text-slate-500",
              )}
            >
              {client.weightTrend === "DOWN"
                ? "↓ peso"
                : client.weightTrend === "UP"
                  ? "↑ peso"
                  : client.weightTrend === "STABLE"
                    ? "→ stallo"
                    : "—"}
            </span>
          </div>
        </Card>
      </Link>

      {/* Delete button — bottom right */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete({ id: client.clientId, name: client.clientName });
        }}
        className="absolute bottom-3 right-3 w-7 h-7 rounded-[var(--radius-sm)] bg-red-500/10 text-red-400/40 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        aria-label={`Elimina ${client.clientName}`}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function NewClientButton({ onCreated }: { onCreated: (id: string) => void }) {
  const [creating, setCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleCreate = async () => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) return;
    setCreating(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName }),
    });
    const data = await res.json();
    setCreating(false);
    setShowDialog(false);
    setFirstName("");
    setLastName("");
    if (data.client?.id) onCreated(data.client.id);
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 h-10 px-4 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 shadow-sm shadow-cyan-500/20"
      >
        <Plus size={16} />
        Nuovo cliente
      </button>

      <AnimatePresence>
        {showDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => !creating && setShowDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springSoft}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-[var(--radius-lg)] shadow-xl w-full max-w-sm p-6 backdrop-blur-sm">
                <h3 className="font-display text-lg text-slate-100 mb-4">Nuovo cliente</h3>
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="font-meta text-slate-500 text-xs">Nome</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Nome"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="font-meta text-slate-500 text-xs">Cognome</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Cognome"
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowDialog(false)}
                    disabled={creating}
                    className="h-9 px-4 rounded-[var(--radius-sm)] bg-slate-800/50 border border-slate-700/50 text-sm font-body text-slate-400 hover:text-slate-100 transition-colors disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !firstName.trim()}
                    className="h-9 px-4 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
                  >
                    {creating ? "Creazione..." : "Crea"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-5">
          <Skeleton width="60%" height={20} className="mb-2" />
          <Skeleton width="40%" height={14} className="mb-4" />
          <div className="flex items-end justify-between">
            <Skeleton width={80} height={32} />
            <Skeleton width={60} height={12} />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoadError(null);
    try {
      const r = await fetchWithTimeout("/api/dashboard");
      if (!r.ok) throw new Error(`API error: ${r.status}`);
      const d = await r.json();
      if (!d.stats || !d.attentionScores) throw new Error("Invalid API response shape");
      setData(d);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Errore di connessione");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-6 mobile-bottom-pad">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springSoft}
                className="font-display text-3xl text-slate-100 text-center"
              >
                Dashboard
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="font-body text-slate-400 mt-1 text-center"
              >
                Panoramica dei tuoi clienti attivi
              </motion.p>
            </div>
            <NewClientButton onCreated={(id) => router.push(`/dashboard/clients/${id}`)} />
          </div>

          {/* Stats */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 relative overflow-hidden">
                <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-r opacity-20 blur-xl from-cyan-500 to-blue-500" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-cyan-500/20 flex items-center justify-center">
                    <Users size={18} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-meta text-slate-500">Clienti attivi</p>
                    <p className="font-display text-2xl text-slate-100">{data.stats.activeClients}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 relative overflow-hidden">
                <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-r opacity-20 blur-xl from-green-500 to-emerald-500" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-green-500/20 flex items-center justify-center">
                    <Activity size={18} className="text-green-400" />
                  </div>
                  <div>
                    <p className="font-meta text-slate-500">Check-in totali</p>
                    <p className="font-display text-2xl text-slate-100">{data.stats.totalCheckIns}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 relative overflow-hidden">
                <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-r opacity-20 blur-xl from-purple-500 to-pink-500" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-purple-500/20 flex items-center justify-center">
                    <TrendingDown size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="font-meta text-slate-500">Piani attivi</p>
                    <p className="font-display text-2xl text-slate-100">{data.stats.totalPlans}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 relative overflow-hidden">
                <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-r opacity-20 blur-xl from-amber-500 to-red-500" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="font-meta text-slate-500">Attenzione richiesta</p>
                    <p className="font-display text-2xl text-slate-100">
                      {data.attentionScores.filter((s) => s.score >= 20).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Attention section */}
          {data && data.attentionScores.some((s) => s.score >= 20) && (
            <div className="mb-8">
              <h2 className="font-display text-lg text-slate-100 mb-4">Richiede attenzione</h2>
              <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.attentionScores
                  .filter((s) => s.score >= 20)
                  .map((client) => (
                    <StaggerItem key={client.clientId}>
                      <ClientCard client={client} onDelete={setDeleteTarget} />
                    </StaggerItem>
                  ))}
              </StaggerList>
            </div>
          )}

          {/* Error banner */}
          {loadError && !loading && (
            <div className="mb-6 p-4 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/30 text-center">
              <p className="font-body text-sm text-red-400">{loadError}</p>
              <button
                onClick={fetchData}
                className="mt-2 font-body text-xs text-red-400 underline hover:text-red-300"
              >
                Riprova
              </button>
            </div>
          )}

          {/* All clients */}
          <div>
            <h2 className="font-display text-lg text-slate-100 mb-4">Tutti i clienti</h2>
            {loading ? (
              <DashboardSkeleton />
            ) : !data || data.attentionScores.length === 0 ? (
              <Card className="p-12 text-center">
                <Users size={48} className="mx-auto text-slate-600 mb-4" />
                <h3 className="font-display text-xl text-slate-200 mb-2">Nessun cliente</h3>
                <p className="font-body text-slate-400 text-sm">
                  Inizia aggiungendo il tuo primo cliente.
                </p>
              </Card>
            ) : (
              <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.attentionScores.map((client) => (
                  <StaggerItem key={client.clientId}>
                    <ClientCard client={client} onDelete={setDeleteTarget} />
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </div>
        </main>
      </div>

      {/* Delete confirmation popup */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 "
              onClick={() => !deleting && setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springSoft}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-[var(--radius-lg)] shadow-xl w-full max-w-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-slate-100">Elimina cliente</h3>
                    <p className="font-body text-sm text-slate-400">{deleteTarget.name}</p>
                  </div>
                </div>
                <p className="font-body text-sm text-slate-400 mb-6">
                  Questa azione è irreversibile. Tutti i dati del cliente
                  (check-in, piani, misurazioni) verranno eliminati.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                    className="h-9 px-4 rounded-[var(--radius-sm)] bg-slate-800/50 border border-slate-700/50 text-sm font-body text-slate-400 hover:text-slate-100 transition-colors disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="h-9 px-4 rounded-[var(--radius-sm)] bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? "Eliminazione..." : "Elimina"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
