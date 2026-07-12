"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface ClientData {
  id: string;
  fullName: string;
  phoneNumberE164: string;
  email: string | null;
  sex: string | null;
  age: number | null;
  heightCm: number | null;
  startWeightKg: number | null;
  diet: string;
  activityFactor: number;
  goal: string;
  trainingDaysWk: number;
  waterTargetL: number;
  bmrManualKcal: number | null;
  tdeeManualKcal: number | null;
  mealDistribution: string | null;
  exclusions: string;
  medicalNotes: string | null;
}

const DEFAULT_DISTRIBUTION = {
  COLAZIONE: 25,
  SPUNTINO_MATTINA: 10,
  PRANZO: 35,
  SPUNTINO_POMERIGGIO: 10,
  CENA: 20,
};

const MEAL_SLOT_LABELS: Record<string, string> = {
  COLAZIONE: "Colazione",
  SPUNTINO_MATTINA: "Spuntino Mattina",
  PRANZO: "Pranzo",
  SPUNTINO_POMERIGGIO: "Spuntino Pomeriggio",
  CENA: "Cena",
};

const EXCLUSION_OPTIONS = [
  "glutine",
  "lattosio",
  "frutta secca",
  "uova",
  "soia",
  "pesce",
];

const ACTIVITY_OPTIONS = [
  { value: 1.2, label: "Sedentario" },
  { value: 1.375, label: "Leggero (1-3 sett)" },
  { value: 1.55, label: "Moderato (3-5 sett)" },
  { value: 1.725, label: "Intenso (6-7 sett)" },
  { value: 1.9, label: "Molto intenso (2x/die)" },
] as const;

export function ProfileForm({
  client,
  onSaved,
}: {
  client: ClientData;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName: client.fullName,
    phoneNumberE164: client.phoneNumberE164,
    email: client.email || "",
    sex: client.sex || "M",
    age: client.age?.toString() || "",
    height: client.heightCm?.toString() || "",
    startWeight: client.startWeightKg?.toString() || "",
    activity: client.activityFactor.toString(),
    activityCustom:
      ACTIVITY_OPTIONS.some((o) => o.value === client.activityFactor)
        ? ""
        : client.activityFactor.toString(),
    goal: client.goal,
    kcalAdjust: "",
    trainingDays: client.trainingDaysWk.toString(),
    waterL: client.waterTargetL.toString(),
    bmrManual: client.bmrManualKcal?.toString() || "",
    tdeeManual: client.tdeeManualKcal?.toString() || "",
    diet: client.diet,
    exclusions: JSON.parse(client.exclusions || "[]") as string[],
    medicalNotes: client.medicalNotes || "",
    mealDistribution: (() => {
      try {
        const parsed = JSON.parse(client.mealDistribution || "");
        return { ...DEFAULT_DISTRIBUTION, ...parsed };
      } catch {
        return { ...DEFAULT_DISTRIBUTION };
      }
    })(),
  });

  const [saving, setSaving] = useState(false);

  const isCustomActivity = !ACTIVITY_OPTIONS.some(
    (o) => o.value.toString() === form.activity,
  );

  const handleChange = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleExclusion = (ex: string) => {
    setForm((prev) => ({
      ...prev,
      exclusions: prev.exclusions.includes(ex)
        ? prev.exclusions.filter((e) => e !== ex)
        : [...prev.exclusions, ex],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const activityValue =
      isCustomActivity && form.activityCustom
        ? parseFloat(form.activityCustom)
        : parseFloat(form.activity);

    await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        phoneNumberE164: form.phoneNumberE164,
        email: form.email || null,
        sex: form.sex || null,
        age: form.age ? parseInt(form.age) : null,
        heightCm: form.height ? parseFloat(form.height) : null,
        startWeightKg: form.startWeight ? parseFloat(form.startWeight) : null,
        activityFactor: activityValue,
        goal: form.goal,
        trainingDaysWk: form.trainingDays ? parseInt(form.trainingDays) : 3,
        waterTargetL: form.waterL ? parseFloat(form.waterL) : 2,
        bmrManualKcal: form.bmrManual ? parseFloat(form.bmrManual) : null,
        tdeeManualKcal: form.tdeeManual ? parseFloat(form.tdeeManual) : null,
        diet: form.diet,
        exclusions: form.exclusions,
        medicalNotes: form.medicalNotes || null,
        mealDistribution: form.mealDistribution,
      }),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 overflow-x-hidden">
      <h2 className="font-display text-2xl text-slate-100 text-center">Profilo cliente</h2>

      {/* Card 1: Anagrafica */}
      <Card title="Anagrafica">
        <div className="space-y-4">
          <div>
            <label className="font-meta text-slate-500 text-xs">Nome completo</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
            />
          </div>
          <div>
            <label className="font-meta text-slate-500 text-xs">Telefono (WhatsApp)</label>
            <input
              type="tel"
              value={form.phoneNumberE164}
              onChange={(e) => handleChange("phoneNumberE164", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
            />
          </div>
          <div>
            <label className="font-meta text-slate-500 text-xs">Email (opzionale)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
            />
          </div>

          {/* Sesso */}
          <div>
            <label className="font-meta text-slate-500 text-xs">Sesso biologico</label>
            <div className="flex gap-2 mt-1">
              {(["M", "F"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleChange("sex", s)}
                  className={cn(
                    "flex-1 h-10 rounded-[var(--radius-sm)] border text-sm font-body transition-all",
                    form.sex === s
                      ? "bg-cyan-600 text-white border-cyan-600"
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-cyan-500/30",
                  )}
                >
                  {s === "M" ? "Maschile" : "Femminile"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-meta text-slate-500 text-xs">Età</label>
              <input
                type="number"
                min={14}
                max={100}
                value={form.age}
                onChange={(e) => handleChange("age", e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
              />
            </div>
            <div>
              <label className="font-meta text-slate-500 text-xs">Altezza (cm)</label>
              <input
                type="number"
                min={120}
                max={230}
                value={form.height}
                onChange={(e) => handleChange("height", e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
              />
            </div>
            <div>
              <label className="font-meta text-slate-500 text-xs">Peso partenza (kg)</label>
              <input
                type="number"
                min={30}
                step={0.1}
                value={form.startWeight}
                onChange={(e) => handleChange("startWeight", e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Card 2: Attività e obiettivo */}
      <Card title="Attività e obiettivo">
        <div className="space-y-4">
          <div>
            <label className="font-meta text-slate-500 text-xs">Livello di attività</label>
            <select
              value={isCustomActivity ? "custom" : form.activity}
              onChange={(e) => handleChange("activity", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
            >
              {ACTIVITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value="custom">Personalizzato</option>
            </select>
          </div>

          {isCustomActivity && (
            <div>
              <label className="font-meta text-slate-500 text-xs">Fattore personalizzato</label>
              <input
                type="number"
                min={1}
                max={2.5}
                step={0.01}
                value={form.activityCustom}
                onChange={(e) => handleChange("activityCustom", e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
              />
            </div>
          )}

          <div>
            <label className="font-meta text-slate-500 text-xs">Obiettivo</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(
                [
                  { value: "cut", label: "Definizione", color: "cyan" },
                  { value: "maintain", label: "Mantenimento", color: "purple" },
                  { value: "bulk", label: "Massa", color: "green" },
                ] as const
              ).map((g) => (
                <button
                  key={g.value}
                  onClick={() => handleChange("goal", g.value)}
                  className={cn(
                    "h-10 rounded-[var(--radius-sm)] border text-sm font-body transition-all",
                    form.goal === g.value
                      ? `bg-${g.color}-600 text-white border-${g.color}-600`
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-cyan-500/30",
                  )}
                  style={
                    form.goal === g.value
                      ? {
                          backgroundColor:
                            g.color === "cyan"
                              ? "#0891b2"
                              : g.color === "green"
                                ? "#16a34a"
                                : "#9333ea",
                          borderColor:
                            g.color === "cyan"
                              ? "#0891b2"
                              : g.color === "green"
                                ? "#16a34a"
                                : "#9333ea",
                        }
                      : undefined
                  }
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-meta text-slate-500 text-xs">Aggiustamento kcal</label>
              <input
                type="number"
                step={50}
                placeholder={form.goal === "cut" ? "-400" : form.goal === "bulk" ? "+300" : "0"}
                value={form.kcalAdjust}
                onChange={(e) => handleChange("kcalAdjust", e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="font-meta text-slate-500 text-xs">Allenamenti / sett</label>
              <input
                type="number"
                min={0}
                max={7}
                value={form.trainingDays}
                onChange={(e) => handleChange("trainingDays", e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="font-meta text-slate-500 text-xs">Acqua target (L/giorno)</label>
            <input
              type="number"
              min={1}
              max={5}
              step={0.25}
              value={form.waterL}
              onChange={(e) => handleChange("waterL", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
            />
          </div>
        </div>
      </Card>

      {/* Card 3: Distribuzione pasti */}
      <Card title="Distribuzione calorica pasti">
        <p className="font-body text-xs text-slate-400 mb-4">
          Percentuale di calorie assegnata a ogni pasto. La somma deve essere 100%.
        </p>
        <div className="space-y-3">
          {(Object.keys(MEAL_SLOT_LABELS) as Array<keyof typeof MEAL_SLOT_LABELS>).map((slot) => {
            const totalKcal = parseFloat(form.tdeeManual) || 2000;
            const pct = form.mealDistribution[slot] || 0;
            const kcal = Math.round(totalKcal * pct / 100);
            return (
              <div key={slot} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="font-body text-sm text-slate-300 w-36 shrink min-w-0">
                  {MEAL_SLOT_LABELS[slot]}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={5}
                    value={pct}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        mealDistribution: { ...prev.mealDistribution, [slot]: val },
                      }));
                    }}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 min-w-0"
                  />
                  <div className="flex items-center gap-1 w-20 shrink min-w-0">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={5}
                      value={pct}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setForm((prev) => ({
                          ...prev,
                          mealDistribution: { ...prev.mealDistribution, [slot]: val },
                        }));
                      }}
                      className="w-12 h-8 px-1 text-center rounded border border-slate-700/50 bg-slate-800/50 text-xs font-mono text-slate-100"
                    />
                    <span className="font-meta text-[10px] text-slate-500">%</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 w-14 text-right shrink min-w-0 hidden sm:block">
                    {kcal} kcal
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 sm:hidden">
                  {kcal} kcal
                </span>
              </div>
            );
          })}
          {/* Total bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
            <span className="font-meta text-slate-500 text-xs">Totale</span>
            <TotalBar distribution={form.mealDistribution} />
          </div>
        </div>
      </Card>

      {/* Card 4: Override manuali */}
      <Card title="Override manuali (opzionale)">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-meta text-slate-500 text-xs">BMR manuale (kcal)</label>
            <input
              type="number"
              min={500}
              max={3500}
              step={10}
              placeholder="Auto-calcolato"
              value={form.bmrManual}
              onChange={(e) => handleChange("bmrManual", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="font-meta text-slate-500 text-xs">TDEE manuale (kcal)</label>
            <input
              type="number"
              min={800}
              max={6000}
              step={10}
              placeholder="Auto-calcolato"
              value={form.tdeeManual}
              onChange={(e) => handleChange("tdeeManual", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 placeholder:text-slate-600"
            />
          </div>
        </div>
      </Card>

      {/* Card 4: Alimentazione */}
      <Card title="Alimentazione e preferenze">
        <div className="space-y-4">
          <div>
            <label className="font-meta text-slate-500 text-xs">Regime alimentare</label>
            <select
              value={form.diet}
              onChange={(e) => handleChange("diet", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100"
            >
              <option value="ONNIVORO">Onnivoro</option>
              <option value="PESCETARIANO">Pescetariano</option>
              <option value="VEGETARIANO">Vegetariano</option>
              <option value="VEGANO">Vegano</option>
            </select>
          </div>

          <div>
            <label className="font-meta text-slate-500 text-xs">Esclusioni / intolleranze</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {EXCLUSION_OPTIONS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => toggleExclusion(ex)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-body border transition-all",
                    form.exclusions.includes(ex)
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-red-500/30",
                  )}
                >
                  No {ex}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-meta text-slate-500 text-xs">Note mediche / salute</label>
            <textarea
              rows={3}
              value={form.medicalNotes}
              onChange={(e) => handleChange("medicalNotes", e.target.value)}
              placeholder="Injuries, condizioni mediche, farmaci..."
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 resize-none placeholder:text-slate-600"
            />
          </div>
        </div>
      </Card>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="h-10 px-6 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 shadow-sm shadow-cyan-500/20"
      >
        {saving ? "Salvataggio..." : "Salva profilo"}
      </button>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-5">
      <h3 className="font-meta text-slate-500 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function TotalBar({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);
  return (
    <span className={`font-mono text-sm font-medium ${total === 100 ? "text-green-400" : "text-red-400"}`}>
      {total}%
    </span>
  );
}
