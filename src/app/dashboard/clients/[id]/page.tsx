"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { springSoft, duration, easeOutApple } from "@/lib/motion";
import { cn } from "@/lib/cn";
import {
  ArrowLeft,
  User,
  BarChart3,
  Target,
  Utensils,
  Camera,
  StickyNote,
  Ruler,
  TrendingDown,
  TrendingUp,
  Minus,
  Dumbbell,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { showToast } from "@/components/ui/toast";
import { ProfileForm } from "./profile-form";
import { StrategyEditor } from "./strategy-editor";
import { PlanBuilder } from "./plan-builder";
import { TrainingTab } from "./training-tab";

// Types
interface CheckIn {
  id: string;
  weightKg: number | null;
  sleepHours: number | null;
  stressLevel: number | null;
  energyLevel: number | null;
  adherencePct: number | null;
  notes: string | null;
  source: string;
  createdAt: string;
}

interface Client {
  id: string;
  fullName: string;
  phoneNumberE164: string;
  email: string | null;
  status: string;
  sex: string | null;
  age: number | null;
  heightCm: number | null;
  startWeightKg: number | null;
  exclusions: string;
  diet: string;
  activityFactor: number;
  goal: string;
  trainingDaysWk: number;
  waterTargetL: number;
  bmrManualKcal: number | null;
  tdeeManualKcal: number | null;
  mealDistribution: string | null;
  medicalNotes: string | null;
  createdAt: string;
  checkIns: CheckIn[];
  dietPlans: unknown[];
  _count: { checkIns: number; dietPlans: number };
}

const tabs = [
  { key: "feed", label: "Feed", icon: BarChart3, step: "01" },
  { key: "profile", label: "Dati", icon: User, step: "02" },
  { key: "strategy", label: "Strategia", icon: Target, step: "03" },
  { key: "plan", label: "Piano", icon: Utensils, step: "04" },
  { key: "training", label: "Allenamento", icon: Dumbbell, step: "05" },
  { key: "measure", label: "Misure", icon: Ruler, step: "+" },
  { key: "photos", label: "Foto", icon: Camera, step: "+" },
  { key: "notes", label: "Note", icon: StickyNote, step: "+" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

// --- Feed Tab ---
function FeedTab({ client }: { client: Client }) {
  const sortedCheckIns = [...client.checkIns].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const latest = sortedCheckIns[0];
  const previous = sortedCheckIns[1];

  const weightDiff =
    latest?.weightKg && previous?.weightKg
      ? (latest.weightKg - previous.weightKg).toFixed(1)
      : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Latest measurement summary */}
      {latest && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-5">
          <h3 className="font-meta text-slate-500 mb-3">Ultima rilevazione</h3>
          <div className="flex items-baseline gap-3">
            {latest.weightKg && (
              <div>
                <span className="font-display text-4xl text-slate-100">{latest.weightKg}</span>
                <span className="font-meta text-slate-500 ml-1">kg</span>
              </div>
            )}
            {weightDiff && (
              <span
                className={cn(
                  "font-mono text-sm",
                  parseFloat(weightDiff) < 0
                    ? "text-cyan-400"
                    : parseFloat(weightDiff) > 0
                      ? "text-green-400"
                      : "text-slate-500",
                )}
              >
                {parseFloat(weightDiff) > 0 ? "+" : ""}
                {weightDiff} kg
              </span>
            )}
          </div>
          <p className="font-meta text-slate-600 mt-1">
            {new Date(latest.createdAt).toLocaleDateString("it-IT")}
          </p>
        </div>
      )}

      {/* Checklist */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-5">
        <h3 className="font-meta text-slate-500 mb-3">Checklist revisione</h3>
        <div className="space-y-2 text-sm">
          <CheckItem
            done={!!client.sex && !!client.age && !!client.heightCm && !!client.startWeightKg}
            label="Profilo completo"
          />
          <CheckItem
            done={sortedCheckIns.length > 0}
            label={`Ultimo check-in: ${sortedCheckIns.length > 0 ? new Date(sortedCheckIns[0].createdAt).toLocaleDateString("it-IT") : "mai"}`}
          />
          <CheckItem
            done={sortedCheckIns.length >= 3}
            label={`Misurazioni: ${sortedCheckIns.length}/3 minime`}
          />
        </div>
      </div>

      {/* Recent check-ins */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-5">
        <h3 className="font-meta text-slate-500 mb-3">Storico check-in</h3>
        {sortedCheckIns.length === 0 ? (
          <div className="text-center py-6">
            <BarChart3 size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="font-body text-sm text-slate-400">Nessun check-in registrato.</p>
            <p className="font-body text-xs text-slate-600 mt-1">
              I check-in appariranno qui quando il cliente invia dati via WhatsApp.
            </p>
          </div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            initial="hidden"
            animate="show"
          >
            {sortedCheckIns.slice(0, 10).map((ci) => (
              <motion.div
                key={ci.id}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0"
              >
                <span className="font-body text-sm text-slate-200">
                  {new Date(ci.createdAt).toLocaleDateString("it-IT")}
                </span>
                <div className="flex items-center gap-3">
                  {ci.weightKg && (
                    <span className="font-mono text-sm text-slate-200">{ci.weightKg} kg</span>
                  )}
                  {ci.notes && (
                    <span className="text-xs text-slate-500 max-w-[200px] truncate">
                      {ci.notes}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Weekly Review action */}
      <div className="pt-2">
        <Link
          href={`/dashboard/clients/${client.id}/review`}
          className="block w-full py-3 text-center rounded-[var(--radius-md)] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
        >
          Apri Weekly Review
        </Link>
      </div>
    </div>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-4 h-4 rounded-sm border flex items-center justify-center",
          done ? "bg-green-500 border-green-500" : "border-slate-600",
        )}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className={cn("text-sm", done ? "text-slate-200" : "text-slate-400")}>{label}</span>
    </div>
  );
}

// --- AI Generation Wrapper for Plan Tab ---
function PlanBuilderWithAI({
  client,
  onSaved,
}: {
  client: {
    id: string;
    fullName: string;
    exclusions: string;
    diet: string;
    startWeightKg: number | null;
    sex: string | null;
    age: number | null;
    heightCm: number | null;
  };
  onSaved: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProfileComplete = client.sex && client.age && client.heightCm && client.startWeightKg;

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.missingFields) {
          setError(`Dati mancanti: ${data.missingFields.join(", ")}. Vai alla tab "Dati" per compilarli.`);
        } else {
          setError(data.error || "Errore durante la generazione");
        }
        return;
      }
      showToast(`Piano generato con successo (${data.mealsCount} pasti)`, "success");
      onSaved();
    } catch {
      setError("Errore di connessione");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Generate Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-[var(--radius-md)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm text-slate-100 flex items-center gap-2">
              <span className="text-lg">✨</span> Genera piano con AI
            </h3>
            <p className="font-body text-xs text-slate-400 mt-1">
              L&apos;AI compilerà un piano alimentare basato sui dati del cliente e il catalogo alimenti.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !isProfileComplete}
            className="flex items-center gap-2 h-9 px-4 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 shrink-0"
          >
            {generating ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                Generazione...
              </>
            ) : (
              <>
                <span>✨</span>
                Genera piano
              </>
            )}
          </button>
        </div>
        {!isProfileComplete && (
          <p className="font-body text-xs text-amber-400 mt-2">
            ⚠️ Compila tutti i dati del cliente (sesso, età, altezza, peso) prima di generare.
          </p>
        )}
        {error && (
          <p className="font-body text-xs text-red-400 mt-2">❌ {error}</p>
        )}
      </div>

      {/* Existing Plan Builder */}
      <PlanBuilder client={client} onSaved={onSaved} />
    </div>
  );
}

// --- AI Generation Wrapper for Training Tab ---
function TrainingTabWithAI({
  clientId,
  client,
  onSaved,
}: {
  clientId: string;
  client: {
    sex: string | null;
    age: number | null;
    heightCm: number | null;
    startWeightKg: number | null;
  };
  onSaved: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProfileComplete = client.sex && client.age && client.heightCm && client.startWeightKg;

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.missingFields) {
          setError(`Dati mancanti: ${data.missingFields.join(", ")}. Vai alla tab "Dati" per compilarli.`);
        } else {
          setError(data.error || "Errore durante la generazione");
        }
        return;
      }
      showToast(`Piano allenamento generato (${data.sessionsCount} sessioni)`, "success");
      onSaved();
    } catch {
      setError("Errore di connessione");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Generate Banner */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-[var(--radius-md)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm text-slate-100 flex items-center gap-2">
              <span className="text-lg">💪</span> Genera allenamento con AI
            </h3>
            <p className="font-body text-xs text-slate-400 mt-1">
              L&apos;AI compilerà un piano di allenamento basato sui dati del cliente e il catalogo esercizi.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !isProfileComplete}
            className="flex items-center gap-2 h-9 px-4 rounded-[var(--radius-sm)] bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 shrink-0"
          >
            {generating ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                Generazione...
              </>
            ) : (
              <>
                <span>💪</span>
                Genera allenamento
              </>
            )}
          </button>
        </div>
        {!isProfileComplete && (
          <p className="font-body text-xs text-amber-400 mt-2">
            ⚠️ Compila tutti i dati del cliente (sesso, età, altezza, peso) prima di generare.
          </p>
        )}
        {error && (
          <p className="font-body text-xs text-red-400 mt-2">❌ {error}</p>
        )}
      </div>

      {/* Existing Training Tab */}
      <TrainingTab clientId={clientId} />
    </div>
  );
}

// --- Main Page ---
export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("feed");
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      setClient(data.client);
    } catch {
      console.error("Failed to load client");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="skeleton w-48 h-8 rounded-[var(--radius-sm)]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="font-body text-slate-400 mb-4">Cliente non trovato.</p>
          <Link href="/dashboard" className="text-cyan-400 text-sm hover:underline">
            Torna alla dashboard
          </Link>
        </div>
      </div>
    );
  }

  const goalIcon =
    client.goal === "CUT" ? (
      <TrendingDown size={14} className="text-cyan-400" />
    ) : client.goal === "BULK" ? (
      <TrendingUp size={14} className="text-green-400" />
    ) : (
      <Minus size={14} className="text-purple-400" />
    );

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-slate-900/50 border-r border-slate-700/50">
        {/* Back + client info */}
        <div className="p-4 border-b border-slate-700/50">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <h2 className="font-display text-xl text-slate-100">{client.fullName}</h2>
          <div className="flex items-center gap-2 mt-1">
            {goalIcon}
            <span className="font-meta text-slate-500">
              {client.goal} · {client.diet}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex-1 p-2 space-y-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm transition-all duration-200",
                  isActive
                    ? "bg-slate-800/70 text-cyan-400 font-medium"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
                )}
              >
                <tab.icon size={16} />
                <span className="flex-1 text-left">{tab.label}</span>
                <span className="font-mono text-[10px] text-slate-600">{tab.step}</span>
              </button>
            );
          })}
        </nav>

        {/* Delete client */}
        <div className="p-3 mt-auto border-t border-slate-700/50">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
            Elimina cliente
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile tab bar */}
        <div className="md:hidden flex border-b border-slate-700/50 overflow-x-auto sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-3 text-xs whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-500",
              )}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6 mobile-bottom-pad">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: duration.fast, ease: easeOutApple }}
              className="w-full max-w-5xl mx-auto"
            >
              {activeTab === "feed" && <FeedTab client={client} />}
              {activeTab === "profile" && (
                <ProfileForm client={client} onSaved={fetchClient} />
              )}
              {activeTab === "strategy" && (
                <StrategyEditor client={client} onSaved={fetchClient} />
              )}
              {activeTab === "plan" && (
                <PlanBuilderWithAI client={client} onSaved={fetchClient} />
              )}
              {activeTab === "training" && (
                <TrainingTabWithAI clientId={client.id} client={client} onSaved={fetchClient} />
              )}
              {activeTab === "measure" && (
                <MeasureTab clientId={client.id} onSaved={fetchClient} />
              )}
              {activeTab === "photos" && (
                <div className="max-w-md mx-auto text-center py-12">
                  <Camera size={48} className="mx-auto text-slate-600 mb-3" />
                  <h3 className="font-display text-lg text-slate-200 mb-1">Foto progresso</h3>
                  <p className="font-body text-sm text-slate-400">
                    Le foto dei pasti e della composizione corporea appariranno qui
                    quando il cliente le invia via WhatsApp.
                  </p>
                </div>
              )}
              {activeTab === "notes" && (
                <NotesTab clientId={client.id} checkIns={client.checkIns} onSaved={fetchClient} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 "
              onClick={() => !deleting && setShowDeleteConfirm(false)}
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
                    <p className="font-body text-sm text-slate-400">{client.fullName}</p>
                  </div>
                </div>
                <p className="font-body text-sm text-slate-400 mb-6">
                  Questa azione è irreversibile. Tutti i dati del cliente
                  (check-in, piani dieta, piani allenamento, misurazioni, foto,
                  note) verranno eliminati definitivamente.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
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

// --- Measure Tab ---
function MeasureTab({ clientId, onSaved }: { clientId: string; onSaved: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [chest, setChest] = useState("");
  const [arm, setArm] = useState("");
  const [thigh, setThigh] = useState("");
  const [calf, setCalf] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/clients/measurement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        date,
        weight: weight ? parseFloat(weight) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        chest: chest ? parseFloat(chest) : null,
        arm: arm ? parseFloat(arm) : null,
        thigh: thigh ? parseFloat(thigh) : null,
        calf: calf ? parseFloat(calf) : null,
        notes,
      }),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="font-display text-2xl text-slate-100 text-center">Nuova misurazione</h2>

      <div className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-5 space-y-4">
        <div>
          <label className="font-meta text-slate-500 text-xs">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MeasureField label="Peso" unit="kg" value={weight} onChange={setWeight} />
          <MeasureField label="Vita" unit="cm" value={waist} onChange={setWaist} />
          <MeasureField label="Fianchi" unit="cm" value={hips} onChange={setHips} />
          <MeasureField label="Petto" unit="cm" value={chest} onChange={setChest} />
          <MeasureField label="Braccio" unit="cm" value={arm} onChange={setArm} />
          <MeasureField label="Coscia" unit="cm" value={thigh} onChange={setThigh} />
          <MeasureField label="Polpaccio" unit="cm" value={calf} onChange={setCalf} />
        </div>

        <div>
          <label className="font-meta text-slate-500 text-xs">Note</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full px-3 py-2 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="h-10 px-6 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 shadow-sm shadow-cyan-500/20"
      >
        {saving ? "Salvataggio..." : "Salva misurazione"}
      </button>
    </div>
  );
}

function MeasureField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="font-meta text-slate-500 text-xs">
        {label} ({unit})
      </label>
      <input
        type="number"
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
      />
    </div>
  );
}

// --- Notes Tab ---
function NotesTab({
  clientId,
  checkIns,
  onSaved,
}: {
  clientId: string;
  checkIns: CheckIn[];
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const notes = checkIns
    .filter((ci) => ci.notes && !ci.notes.startsWith("[LEGACY_PLAN_IMPORT]"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await fetch("/api/clients/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, text: text.trim() }),
    });
    setText("");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="font-display text-2xl text-slate-100 text-center">Note</h2>

      <div className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Aggiungi una nota..."
          className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 resize-none placeholder:text-slate-500"
        />
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="mt-2 h-8 px-4 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Aggiungi nota"}
        </button>
      </div>

      <motion.div
        className="space-y-3"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        initial="hidden"
        animate="show"
      >
        {notes.map((ci) => (
          <motion.div
            key={ci.id}
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-4"
          >
            <p className="font-body text-sm text-slate-200">{ci.notes}</p>
            <p className="font-meta text-slate-600 mt-2">
              {new Date(ci.createdAt).toLocaleDateString("it-IT")}
            </p>
          </motion.div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">Nessuna nota.</p>
        )}
      </motion.div>
    </div>
  );
}
