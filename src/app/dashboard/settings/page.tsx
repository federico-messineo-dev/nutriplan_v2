"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springSoft } from "@/lib/motion";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  User,
  Mail,
  Building,
  Save,
  CheckCircle,
  Users,
  Utensils,
  Dumbbell,
  Plus,
  Trash2,
  Search,
  X,
  Edit,
} from "lucide-react";
import { showToast } from "@/components/ui/toast";
import { FOOD_CATEGORY_LABELS, type FoodCategory } from "@/types";

// --- Types ---
interface Trainer {
  id: string;
  email: string;
  fullName: string;
  businessName: string | null;
  createdAt: string;
  clientCount: number;
  alimentCount: number;
  exerciseCount: number;
}

interface Alimento {
  id: string;
  name: string;
  category: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
  dietTags: string[];
  allergens: string[];
  instructions: string | null;
  trainerId: string | null;
}

interface Esercizio {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  videoUrl: string | null;
  substitutionGroup: string | null;
  trainerId: string | null;
}

const EMPTY_ALIMENTO = {
  name: "",
  category: "PROT_ANIMAL_LEAN",
  kcalPer100g: "",
  proteinPer100g: "",
  carbPer100g: "",
  fatPer100g: "",
  dietTags: [] as string[],
  allergens: [] as string[],
};

const EMPTY_ESERCIZIO = {
  name: "",
  muscleGroup: "",
  equipment: "",
  substitutionGroup: "",
};

const MUSCLE_GROUPS = [
  "Petto", "Schiena", "Spalle", "Gambe", "Bicipiti", "Tricipiti", "Core", "Generale",
];

const DIET_OPTIONS = ["ONNIVORO", "PESCETARIANO", "VEGETARIANO", "VEGANO"];

const ALLERGEN_OPTIONS = [
  "glutine", "lattosio", "uova", "soia", "arachidi", "frutta a guscio",
  "pesce", "crostacei", "sesamo", "sedano", "senape", "lupini", "molluschi",
];

const DIET_LABELS: Record<string, string> = {
  ONNIVORO: "Onnivoro",
  PESCETARIANO: "Pescetariano",
  VEGETARIANO: "Vegetariano",
  VEGANO: "Vegano",
};

// --- Main Page ---
export default function SettingsPage() {
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");

  const fetchTrainer = useCallback(async () => {
    setLoadError(null);
    try {
      const r = await fetchWithTimeout("/api/settings");
      if (!r.ok) throw new Error(`API error: ${r.status}`);
      const d = await r.json();
      if (d.trainer) {
        setTrainer(d.trainer);
        setFullName(d.trainer.fullName);
        setEmail(d.trainer.email);
        setBusinessName(d.trainer.businessName || "");
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Errore di connessione");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainer();
  }, [fetchTrainer]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithTimeout("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, businessName: businessName || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrainer(data.trainer);
        showToast("Profilo aggiornato", "success");
      }
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    trainer &&
    (fullName !== trainer.fullName ||
      email !== trainer.email ||
      businessName !== (trainer.businessName || ""));

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-6 mobile-bottom-pad">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <motion.h1
                initial={{ y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springSoft}
                className="font-display text-3xl text-slate-100 text-center"
              >
                Impostazioni
              </motion.h1>
              <motion.p
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="font-body text-slate-400 mt-1 text-center"
              >
                Gestisci il tuo profilo, alimenti ed esercizi
              </motion.p>
            </div>

            {loading ? (
              <div className="space-y-6">
                <Card className="p-4 md:p-6">
                  <Skeleton width="30%" height={20} className="mb-4" />
                  <Skeleton width="100%" height={40} className="mb-3" />
                  <Skeleton width="100%" height={40} className="mb-3" />
                  <Skeleton width="60%" height={40} />
                </Card>
              </div>
            ) : !trainer ? (
              <div className="text-center py-16">
                <Settings size={48} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-display text-lg text-slate-200 mb-1">Errore</h3>
                <p className="font-body text-sm text-slate-400">
                  Impossibile caricare le impostazioni.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile form */}
                <motion.div
                  initial={{ y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="p-4 md:p-6">
                    <h2 className="font-display text-lg text-slate-100 mb-5 flex items-center gap-2">
                      <User size={18} className="text-cyan-400" />
                      Profilo
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="font-meta text-slate-500 text-xs">Nome completo</label>
                        <div className="relative mt-1">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full h-10 pl-9 pr-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-meta text-slate-500 text-xs">Email</label>
                        <div className="relative mt-1">
                          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-10 pl-9 pr-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-meta text-slate-500 text-xs">Nome studio / azienda</label>
                        <div className="relative mt-1">
                          <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Opzionale"
                            className="w-full h-10 pl-9 pr-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="flex items-center gap-2 h-10 px-5 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 shadow-sm shadow-cyan-500/20"
                      >
                        {saving ? (
                          "Salvataggio..."
                        ) : (
                          <>
                            <Save size={14} />
                            Salva
                          </>
                        )}
                      </button>
                      {hasChanges && (
                        <span className="font-body text-xs text-amber-400">
                          Modifiche non salvate
                        </span>
                      )}
                    </div>
                  </Card>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card className="p-4 md:p-6">
                    <h2 className="font-display text-lg text-slate-100 mb-5 flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-400" />
                      Riepilogo
                    </h2>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-800/50 border border-slate-700/30 rounded-[var(--radius-md)] p-4 text-center">
                        <Users size={20} className="mx-auto text-cyan-400 mb-2" />
                        <span className="font-display text-2xl text-slate-100 block">
                          {trainer.clientCount}
                        </span>
                        <span className="font-meta text-[10px] text-slate-500">Clienti</span>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/30 rounded-[var(--radius-md)] p-4 text-center">
                        <Utensils size={20} className="mx-auto text-green-400 mb-2" />
                        <span className="font-display text-2xl text-slate-100 block">
                          {trainer.alimentCount}
                        </span>
                        <span className="font-meta text-[10px] text-slate-500">Alimenti</span>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/30 rounded-[var(--radius-md)] p-4 text-center">
                        <Dumbbell size={20} className="mx-auto text-purple-400 mb-2" />
                        <span className="font-display text-2xl text-slate-100 block">
                          {trainer.exerciseCount}
                        </span>
                        <span className="font-meta text-[10px] text-slate-500">Esercizi</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700/30">
                      <p className="font-body text-xs text-slate-500">
                        Membro dal {new Date(trainer.createdAt).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </Card>
                </motion.div>

                {/* Alimenti Management */}
                <AlimentiManager onCountChange={fetchTrainer} />

                {/* Esercizi Management */}
                <EserciziManager onCountChange={fetchTrainer} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// ALIMENTI MANAGER
// ============================================================
function AlimentiManager({ onCountChange }: { onCountChange: () => void }) {
  const [alimenti, setAlimenti] = useState<Alimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ALIMENTO);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const fetchAlimenti = useCallback(async () => {
    try {
      const res = await fetchWithTimeout("/api/recipes");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setAlimenti(data.recipes || []);
    } catch {
      setAlimenti([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlimenti();
  }, [fetchAlimenti]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return alimenti.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q) && !a.category.toLowerCase().includes(q)) return false;
      if (filterCategory !== "all" && a.category !== filterCategory) return false;
      return true;
    });
  }, [alimenti, search, filterCategory]);

  const openCreate = () => {
    setForm(EMPTY_ALIMENTO);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (a: Alimento) => {
    setForm({
      name: a.name,
      category: a.category,
      kcalPer100g: String(a.kcalPer100g),
      proteinPer100g: String(a.proteinPer100g),
      carbPer100g: String(a.carbPer100g),
      fatPer100g: String(a.fatPer100g),
      dietTags: a.dietTags,
      allergens: a.allergens,
    });
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.kcalPer100g) {
      showToast("Compila nome e kcal/100g", "error");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      kcalPer100g: parseFloat(form.kcalPer100g as string) || 0,
      proteinPer100g: parseFloat(form.proteinPer100g as string) || 0,
      carbPer100g: parseFloat(form.carbPer100g as string) || 0,
      fatPer100g: parseFloat(form.fatPer100g as string) || 0,
    };

    const url = editingId ? `/api/recipes/${editingId}` : "/api/recipes";
    const method = editingId ? "PATCH" : "POST";

    await fetchWithTimeout(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    showToast(editingId ? "Alimento aggiornato" : "Alimento creato", "success");
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_ALIMENTO);
    fetchAlimenti();
    onCountChange();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetchWithTimeout(`/api/recipes/${id}`, { method: "DELETE" });
    showToast("Alimento eliminato", "success");
    fetchAlimenti();
    onCountChange();
  };

  const toggleDietTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      dietTags: f.dietTags.includes(tag)
        ? f.dietTags.filter((t) => t !== tag)
        : [...f.dietTags, tag],
    }));
  };

  const toggleAllergen = (allergen: string) => {
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(allergen)
        ? f.allergens.filter((a) => a !== allergen)
        : [...f.allergens, allergen],
    }));
  };

  const categories = Object.keys(FOOD_CATEGORY_LABELS) as FoodCategory[];

  return (
    <motion.div
      initial={{ y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg text-slate-100 flex items-center gap-2">
            <Utensils size={18} className="text-green-400" />
            Alimenti
            <span className="font-mono text-xs text-slate-500 ml-1">({alimenti.length})</span>
          </h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
          >
            <Plus size={12} />
            Nuovo alimento
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca alimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
          >
            <option value="all">Tutte le categorie</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{FOOD_CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-800/50 rounded-[var(--radius-sm)] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <Utensils size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="font-body text-sm text-slate-400">Nessun alimento trovato.</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-auto">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 py-2 px-3 rounded-[var(--radius-sm)] hover:bg-slate-800/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-slate-100 truncate">{a.name}</p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {FOOD_CATEGORY_LABELS[a.category as FoodCategory] || a.category} · {a.kcalPer100g} kcal · P{a.proteinPer100g} · C{a.carbPer100g} · F{a.fatPer100g}
                  </p>
                </div>
                <button
                  onClick={() => openEdit(a)}
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-cyan-400 transition-all"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <AnimatePresence>
          {showForm && (
            <>
              <motion.div
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60"
                onClick={() => !saving && setShowForm(false)}
              />
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springSoft}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-slate-900/90 border border-slate-700/50 rounded-[var(--radius-lg)] shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h3 className="font-display text-lg text-slate-100">
                      {editingId ? "Modifica alimento" : "Nuovo alimento"}
                    </h3>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-100">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    <div>
                      <label className="font-meta text-slate-500 text-xs">Nome</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
                        placeholder="Es. Petto di pollo"
                      />
                    </div>

                    <div>
                      <label className="font-meta text-slate-500 text-xs">Categoria</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{FOOD_CATEGORY_LABELS[cat]}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Kcal/100g", key: "kcalPer100g" },
                        { label: "Prot/100g", key: "proteinPer100g" },
                        { label: "Carb/100g", key: "carbPer100g" },
                        { label: "Grassi/100g", key: "fatPer100g" },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="font-meta text-slate-500 text-xs">{field.label}</label>
                          <input
                            type="number"
                            step="0.1"
                            value={form[field.key as keyof typeof form] as string}
                            onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                            className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-mono text-slate-100"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="font-meta text-slate-500 text-xs">Diete compatibili</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {DIET_OPTIONS.map((d) => (
                          <button
                            key={d}
                            onClick={() => toggleDietTag(d)}
                            className={`px-3 py-1 rounded-full text-xs font-body border transition-colors ${
                              form.dietTags.includes(d)
                                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                                : "border-slate-700/50 text-slate-400 hover:border-slate-600"
                            }`}
                          >
                            {DIET_LABELS[d]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="font-meta text-slate-500 text-xs">Allergeni</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ALLERGEN_OPTIONS.map((a) => (
                          <button
                            key={a}
                            onClick={() => toggleAllergen(a)}
                            className={`px-3 py-1 rounded-full text-xs font-body border transition-colors ${
                              form.allergens.includes(a)
                                ? "bg-red-500/20 border-red-500/50 text-red-400"
                                : "border-slate-700/50 text-slate-400 hover:border-slate-600"
                            }`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end p-4 border-t border-slate-700/50">
                    <button
                      onClick={() => setShowForm(false)}
                      disabled={saving}
                      className="h-9 px-4 rounded-[var(--radius-sm)] bg-slate-800/50 border border-slate-700/50 text-sm font-body text-slate-400 hover:text-slate-100 transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !form.name}
                      className="h-9 px-4 rounded-[var(--radius-sm)] bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? "Salvataggio..." : editingId ? "Aggiorna" : "Crea"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ============================================================
// ESERCIZI MANAGER
// ============================================================
function EserciziManager({ onCountChange }: { onCountChange: () => void }) {
  const [esercizi, setEsercizi] = useState<Esercizio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ESERCIZIO);
  const [saving, setSaving] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>("all");

  const fetchEsercizi = useCallback(async () => {
    try {
      const res = await fetchWithTimeout("/api/exercises");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setEsercizi(data.exercises || []);
    } catch {
      setEsercizi([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEsercizi();
  }, [fetchEsercizi]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return esercizi.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.muscleGroup.toLowerCase().includes(q)) return false;
      if (filterGroup !== "all" && e.muscleGroup !== filterGroup) return false;
      return true;
    });
  }, [esercizi, search, filterGroup]);

  const openCreate = () => {
    setForm(EMPTY_ESERCIZIO);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (e: Esercizio) => {
    setForm({
      name: e.name,
      muscleGroup: e.muscleGroup,
      equipment: e.equipment || "",
      substitutionGroup: e.substitutionGroup || "",
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.muscleGroup) {
      showToast("Compila nome e gruppo muscolare", "error");
      return;
    }
    setSaving(true);
    const url = editingId ? `/api/exercises/${editingId}` : "/api/exercises";
    const method = editingId ? "PATCH" : "POST";

    await fetchWithTimeout(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    showToast(editingId ? "Esercizio aggiornato" : "Esercizio creato", "success");
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_ESERCIZIO);
    fetchEsercizi();
    onCountChange();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetchWithTimeout(`/api/exercises/${id}`, { method: "DELETE" });
    showToast("Esercizio eliminato", "success");
    fetchEsercizi();
    onCountChange();
  };

  return (
    <motion.div
      initial={{ y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg text-slate-100 flex items-center gap-2">
            <Dumbbell size={18} className="text-purple-400" />
            Esercizi
            <span className="font-mono text-xs text-slate-500 ml-1">({esercizi.length})</span>
          </h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus size={12} />
            Nuovo esercizio
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca esercizio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="h-9 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
          >
            <option value="all">Tutti i gruppi</option>
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-800/50 rounded-[var(--radius-sm)] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <Dumbbell size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="font-body text-sm text-slate-400">Nessun esercizio trovato.</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-auto">
            {filtered.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 py-2 px-3 rounded-[var(--radius-sm)] hover:bg-slate-800/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-slate-100 truncate">{e.name}</p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {e.muscleGroup}{e.equipment ? ` · ${e.equipment}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => openEdit(e)}
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-cyan-400 transition-all"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Form Dialog */}
        <AnimatePresence>
          {showForm && (
            <>
              <motion.div
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60"
                onClick={() => !saving && setShowForm(false)}
              />
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springSoft}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-slate-900/90 border border-slate-700/50 rounded-[var(--radius-lg)] shadow-xl w-full max-w-md">
                  <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h3 className="font-display text-lg text-slate-100">
                      {editingId ? "Modifica esercizio" : "Nuovo esercizio"}
                    </h3>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-100">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    <div>
                      <label className="font-meta text-slate-500 text-xs">Nome</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
                        placeholder="Es. Panca piana"
                      />
                    </div>

                    <div>
                      <label className="font-meta text-slate-500 text-xs">Gruppo muscolare</label>
                      <select
                        value={form.muscleGroup}
                        onChange={(e) => setForm((f) => ({ ...f, muscleGroup: e.target.value }))}
                        className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
                      >
                        <option value="">Seleziona...</option>
                        {MUSCLE_GROUPS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-meta text-slate-500 text-xs">Attrezzatura</label>
                      <input
                        type="text"
                        value={form.equipment}
                        onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
                        className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
                        placeholder="Es. Manubri, bilanciere..."
                      />
                    </div>

                    <div>
                      <label className="font-meta text-slate-500 text-xs">Gruppo sostituzione</label>
                      <input
                        type="text"
                        value={form.substitutionGroup}
                        onChange={(e) => setForm((f) => ({ ...f, substitutionGroup: e.target.value }))}
                        className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
                        placeholder="Es. push_horizontal"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end p-4 border-t border-slate-700/50">
                    <button
                      onClick={() => setShowForm(false)}
                      disabled={saving}
                      className="h-9 px-4 rounded-[var(--radius-sm)] bg-slate-800/50 border border-slate-700/50 text-sm font-body text-slate-400 hover:text-slate-100 transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !form.name || !form.muscleGroup}
                      className="h-9 px-4 rounded-[var(--radius-sm)] bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? "Salvataggio..." : editingId ? "Aggiorna" : "Crea"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
