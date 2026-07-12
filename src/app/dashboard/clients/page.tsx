"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { springSoft } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import { showToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Search,
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowRight,
  AlertTriangle,
  Trash2,
  Plus,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  fullName: string;
  goal: string;
  diet: string;
  sex: string | null;
  age: number | null;
  heightCm: number | null;
  startWeightKg: number | null;
  latestWeight: number | null;
  checkInCount: number;
  planCount: number;
  status: string;
  createdAt: string;
}

const goalLabels: Record<string, string> = {
  CUT: "Definizione",
  MAINTAIN: "Mantenimento",
  BULK: "Massa",
  RECOMP: "Ricomposizione",
};

const dietLabels: Record<string, string> = {
  ONNIVORO: "Onnivoro",
  PESCETARIANO: "Pescetariano",
  VEGETARIANO: "Vegetariano",
  VEGANO: "Vegano",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Attivo",
  PAUSED: "In pausa",
  CHURNED: "Perso",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/20 text-green-400 border-green-500/50",
  PAUSED: "bg-amber-500/20 text-amber-400 border-amber-500/50",
  CHURNED: "bg-red-500/20 text-red-400 border-red-500/50",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterGoal, setFilterGoal] = useState<string>("ALL");
  const [filterDiet, setFilterDiet] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const fetchClients = useCallback(async () => {
    setLoadError(null);
    try {
      const r = await fetchWithTimeout("/api/clients");
      if (!r.ok) throw new Error(`API error: ${r.status}`);
      const d = await r.json();
      setClients(d.clients || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Errore di connessione");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetchWithTimeout(`/api/clients/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteTarget(null);
        fetchClients();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    const fullName = `${newFirstName} ${newLastName}`.trim();
    if (!fullName) return;
    setCreating(true);
    try {
      const res = await fetchWithTimeout("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setShowNewClientDialog(false);
      setNewFirstName("");
      setNewLastName("");
      if (data.client?.id) router.push(`/dashboard/clients/${data.client.id}`);
    } catch {
      showToast("Errore nella creazione del cliente", "error");
    } finally {
      setCreating(false);
    }
  };

  const filtered = clients.filter((c) => {
    const matchesSearch = c.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesGoal = filterGoal === "ALL" || c.goal === filterGoal;
    const matchesDiet = filterDiet === "ALL" || c.diet === filterDiet;
    const matchesStatus = filterStatus === "ALL" || c.status === filterStatus;
    return matchesSearch && matchesGoal && matchesDiet && matchesStatus;
  });

  const hasActiveFilters = search || filterGoal !== "ALL" || filterDiet !== "ALL" || filterStatus !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setFilterGoal("ALL");
    setFilterDiet("ALL");
    setFilterStatus("ALL");
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
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
                  Clienti
                </motion.h1>
                <motion.p
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="font-body text-slate-400 mt-1 text-center"
                >
                  {clients.length} {clients.length === 1 ? "cliente" : "clienti"} totali
                </motion.p>
              </div>
              <button
                onClick={() => setShowNewClientDialog(true)}
                className="flex items-center gap-2 h-10 px-4 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors shadow-sm shadow-cyan-500/20"
              >
                <Plus size={16} />
                Nuovo cliente
              </button>
            </div>

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
                  placeholder="Cerca per nome..."
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
                  value={filterGoal}
                  onChange={(e) => setFilterGoal(e.target.value)}
                  className="h-9 px-3 rounded-full bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 text-sm font-body text-slate-300 outline-none hover:border-cyan-500/30 transition-colors"
                >
                  <option value="ALL">Tutti gli obiettivi</option>
                  {Object.entries(goalLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select
                  value={filterDiet}
                  onChange={(e) => setFilterDiet(e.target.value)}
                  className="h-9 px-3 rounded-full bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 text-sm font-body text-slate-300 outline-none hover:border-cyan-500/30 transition-colors"
                >
                  <option value="ALL">Tutte le diete</option>
                  {Object.entries(dietLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 px-3 rounded-full bg-slate-800/40 backdrop-blur-sm border border-slate-700/40 text-sm font-body text-slate-300 outline-none hover:border-cyan-500/30 transition-colors"
                >
                  <option value="ALL">Tutti gli stati</option>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
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
                {filtered.length} di {clients.length} {clients.length === 1 ? "cliente" : "clienti"}
              </motion.p>
            )}

            {/* Client list */}
            {loading ? (
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
            ) : loadError ? (
              <div className="text-center py-16">
                <AlertTriangle size={48} className="mx-auto text-red-400 mb-3" />
                <h3 className="font-display text-lg text-slate-200 mb-1">Errore di caricamento</h3>
                <p className="font-body text-sm text-slate-400 max-w-xs mx-auto mb-4">{loadError}</p>
                <button
                  onClick={fetchClients}
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
                <Users size={48} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-display text-lg text-slate-200 mb-1">
                  {clients.length === 0 ? "Nessun cliente" : "Nessun risultato"}
                </h3>
                <p className="font-body text-sm text-slate-400 max-w-xs mx-auto">
                  {clients.length === 0
                    ? "Crea il tuo primo cliente per iniziare."
                    : "Prova a modificare i filtri di ricerca."}
                </p>
              </motion.div>
            ) : (
              <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((client) => {
                  const weightDiff =
                    client.latestWeight && client.startWeightKg
                      ? (client.latestWeight - client.startWeightKg).toFixed(1)
                      : null;

                  return (
                    <StaggerItem key={client.id}>
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Card
                          variant="interactive"
                          className="p-5 relative group"
                        >
                          {/* Status badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body border",
                                statusColors[client.status] || statusColors.ACTIVE,
                              )}
                            >
                              {statusLabels[client.status] || client.status}
                            </span>
                            <span className="font-meta text-[10px] text-slate-600">
                              {new Date(client.createdAt).toLocaleDateString("it-IT")}
                            </span>
                          </div>

                          {/* Name */}
                          <h3 className="font-display text-lg text-slate-100 mb-1 truncate">
                            {client.fullName}
                          </h3>

                          {/* Goal + Diet */}
                          <div className="flex items-center gap-2 mb-4">
                            {client.goal === "CUT" ? (
                              <TrendingDown size={12} className="text-cyan-400" />
                            ) : client.goal === "BULK" ? (
                              <TrendingUp size={12} className="text-green-400" />
                            ) : (
                              <Minus size={12} className="text-purple-400" />
                            )}
                            <span className="font-meta text-[10px] text-slate-500">
                              {goalLabels[client.goal] || client.goal} · {dietLabels[client.diet] || client.diet}
                            </span>
                          </div>

                          {/* Stats */}
                          <div className="flex items-baseline justify-between">
                            <div>
                              {client.latestWeight ? (
                                <div className="flex items-baseline gap-2">
                                  <span className="font-display text-2xl text-slate-100">
                                    {client.latestWeight}
                                  </span>
                                  <span className="font-meta text-xs text-slate-500">kg</span>
                                  {weightDiff && (
                                    <span
                                      className={cn(
                                        "font-mono text-xs",
                                        parseFloat(weightDiff) < 0
                                          ? "text-cyan-400"
                                          : parseFloat(weightDiff) > 0
                                            ? "text-green-400"
                                            : "text-slate-500",
                                      )}
                                    >
                                      {parseFloat(weightDiff) > 0 ? "+" : ""}
                                      {weightDiff}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="font-body text-sm text-slate-500">Nessun peso</span>
                              )}
                            </div>
                            <ArrowRight
                              size={16}
                              className="text-slate-600 group-hover:text-cyan-400 transition-colors"
                            />
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700/30">
                            <span className="font-mono text-[10px] text-slate-600">
                              {client.checkInCount} check-in
                            </span>
                            <span className="font-mono text-[10px] text-slate-600">
                              {client.planCount} piani
                            </span>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteTarget({ id: client.id, name: client.fullName });
                            }}
                            className="absolute bottom-3 right-3 w-7 h-7 rounded-[var(--radius-sm)] bg-red-500/10 text-red-400/40 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            aria-label={`Elimina ${client.fullName}`}
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => !deleting && setDeleteTarget(null)}
            />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springSoft}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-[var(--radius-lg)] shadow-xl w-full max-w-sm p-6 backdrop-blur-sm">
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
                  Questa azione è irreversibile. Tutti i dati verranno eliminati.
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

      {/* New client dialog */}
      <AnimatePresence>
        {showNewClientDialog && (
          <>
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => !creating && setShowNewClientDialog(false)}
            />
            <motion.div
              initial={{ scale: 0.95 }}
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
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
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
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="Cognome"
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowNewClientDialog(false)}
                    disabled={creating}
                    className="h-9 px-4 rounded-[var(--radius-sm)] bg-slate-800/50 border border-slate-700/50 text-sm font-body text-slate-400 hover:text-slate-100 transition-colors disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newFirstName.trim()}
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
    </div>
  );
}
