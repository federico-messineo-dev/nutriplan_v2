"use client";

import { useState, useMemo } from "react";
import { calcBMR, calcTDEE, computeMacroTargets } from "@/lib/nutrition-engine";
import type { ProfileForCalc } from "@/lib/nutrition-engine";
import { cn } from "@/lib/cn";

interface ClientData {
  id: string;
  sex: string | null;
  age: number | null;
  heightCm: number | null;
  startWeightKg: number | null;
  activityFactor: number;
  goal: string;
  bmrManualKcal: number | null;
  tdeeManualKcal: number | null;
}

export function StrategyEditor({
  client,
  onSaved,
}: {
  client: ClientData;
  onSaved: () => void;
}) {
  const profile: ProfileForCalc = {
    sex: client.sex as "M" | "F" | null,
    age: client.age,
    heightCm: client.heightCm,
    activityFactor: client.activityFactor,
    goal: client.goal as "CUT" | "MAINTAIN" | "BULK" | "RECOMP",
    bmrManualKcal: client.bmrManualKcal,
    tdeeManualKcal: client.tdeeManualKcal,
  };

  const weight = client.startWeightKg || 70;

  const calc = useMemo(() => {
    try {
      const bmr = calcBMR(profile, weight);
      const { tdeeKcal } = calcTDEE(profile, weight);

      const defaultAdjust =
        profile.goal === "CUT" ? -400 : profile.goal === "BULK" ? 300 : 0;
      const target = tdeeKcal + defaultAdjust;
      const macros = computeMacroTargets(profile.goal, weight, target);

      return {
        bmr,
        tdee: tdeeKcal,
        target,
        defaultAdjust,
        pG: macros.p,
        cG: macros.c,
        fG: macros.f,
        bmrFromFormula: profile.bmrManualKcal == null,
        tdeeFromFormula: profile.tdeeManualKcal == null,
      };
    } catch {
      return null;
    }
  }, [profile, weight]);

  const [targets, setTargets] = useState({
    kcal: calc?.target || 2000,
    p: calc?.pG || 120,
    c: calc?.cG || 200,
    f: calc?.fG || 60,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Save targets — for now store as a note, will be DietPlan in production
    await fetch("/api/clients/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: client.id,
        text: `[TARGETS] kcal=${targets.kcal} p=${targets.p} c=${targets.c} f=${targets.f}`,
      }),
    });
    setSaving(false);
    onSaved();
  };

  const macroDrift = useMemo(() => {
    const totalKcal = targets.p * 4 + targets.c * 4 + targets.f * 9;
    const drift = totalKcal - targets.kcal;
    const pct = Math.abs(drift / targets.kcal) * 100;
    return { drift: Math.round(drift), pct: pct.toFixed(1) };
  }, [targets]);

  if (!calc) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="font-body text-sm">
          Compila il profilo (età, altezza, peso, sesso) per calcolare BMR e TDEE.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-display text-2xl text-slate-100 text-center">Strategia nutrizionale</h2>

      {/* BMR / TDEE Hero */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-5 relative overflow-hidden">
        <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-r opacity-20 blur-xl from-cyan-500 to-blue-500" />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-meta text-slate-500">BMR</p>
            <p className="font-display text-3xl bg-gradient-to-r bg-clip-text text-transparent from-slate-100 to-slate-300">{calc.bmr}</p>
            <p className="font-meta text-slate-600">kcal</p>
            <p className="font-meta text-slate-700 mt-1">
              {calc.bmrFromFormula ? "Mifflin-St Jeor" : "Manuale"}
            </p>
          </div>
          <div>
            <p className="font-meta text-slate-500">TDEE</p>
            <p className="font-display text-3xl bg-gradient-to-r bg-clip-text text-transparent from-slate-100 to-slate-300">{calc.tdee}</p>
            <p className="font-meta text-slate-600">kcal</p>
            <p className="font-meta text-slate-700 mt-1">
              {calc.tdeeFromFormula ? `× ${profile.activityFactor}` : "Manuale"}
            </p>
          </div>
          <div>
            <p className="font-meta text-slate-500">Target</p>
            <p className="font-display text-3xl text-cyan-400">{calc.target}</p>
            <p className="font-meta text-slate-600">kcal</p>
            <p className="font-meta text-slate-700 mt-1">
              {calc.defaultAdjust > 0 ? "+" : ""}
              {calc.defaultAdjust} kcal
            </p>
          </div>
        </div>
      </div>

      {/* Editable targets */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-5">
        <h3 className="font-meta text-slate-500 mb-4">Modifica target</h3>
        <div className="grid grid-cols-4 gap-3">
          <TargetInput
            label="Kcal"
            value={targets.kcal}
            onChange={(v) => setTargets((p) => ({ ...p, kcal: v }))}
            color="cyan"
          />
          <TargetInput
            label="Proteine"
            value={targets.p}
            onChange={(v) => setTargets((p) => ({ ...p, p: v }))}
            color="green"
            unit="g"
          />
          <TargetInput
            label="Carboidrati"
            value={targets.c}
            onChange={(v) => setTargets((p) => ({ ...p, c: v }))}
            color="purple"
            unit="g"
          />
          <TargetInput
            label="Grassi"
            value={targets.f}
            onChange={(v) => setTargets((p) => ({ ...p, f: v }))}
            color="slate"
            unit="g"
          />
        </div>

        {/* Macro drift alert */}
        {Math.abs(parseFloat(macroDrift.pct)) > 5 && (
          <div
            className={cn(
              "mt-3 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-body",
              macroDrift.drift > 0 ? "bg-cyan-500/10 text-cyan-400" : "bg-green-500/10 text-green-400",
            )}
          >
            I macro totalizzano {macroDrift.drift > 0 ? "+" : ""}
            {macroDrift.drift} kcal rispetto al target ({macroDrift.pct}% di drift)
          </div>
        )}

        {/* Quick adjust */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { label: "-100 kcal", delta: { kcal: -100 } },
            { label: "-200 kcal", delta: { kcal: -200 } },
            { label: "+100 kcal", delta: { kcal: 100 } },
            { label: "+200 kcal", delta: { kcal: 200 } },
            { label: "+10g proteine", delta: { p: 10 } },
            { label: "+20g carboidrati", delta: { c: 20 } },
            { label: "-5g grassi", delta: { f: -5 } },
          ].map((q) => (
            <button
              key={q.label}
              onClick={() =>
                setTargets((p) => ({
                  kcal: p.kcal + (q.delta.kcal || 0),
                  p: p.p + (q.delta.p || 0),
                  c: p.c + (q.delta.c || 0),
                  f: p.f + (q.delta.f || 0),
                }))
              }
              className="px-2.5 py-1 rounded-full text-[11px] font-body border border-slate-700/50 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors"
            >
              {q.label}
            </button>
          ))}
          <button
            onClick={() =>
              setTargets({
                kcal: calc.target,
                p: calc.pG,
                c: calc.cG,
                f: calc.fG,
              })
            }
            className="px-2.5 py-1 rounded-full text-[11px] font-body border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            Reset calcolato
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="h-10 px-6 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 shadow-sm shadow-cyan-500/20"
      >
        {saving ? "Salvataggio..." : "Salva strategia"}
      </button>
    </div>
  );
}

function TargetInput({
  label,
  value,
  onChange,
  color,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  unit?: string;
}) {
  const colorMap: Record<string, string> = {
    cyan: "border-cyan-500/30 focus:ring-cyan-500/20",
    green: "border-green-500/30 focus:ring-green-500/20",
    purple: "border-purple-500/30 focus:ring-purple-500/20",
    slate: "border-slate-500/30 focus:ring-slate-500/20",
  };

  return (
    <div>
      <label className="font-meta text-slate-500 text-xs">{label}</label>
      <div className="relative mt-1">
        <input
          type="number"
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className={cn(
            "w-full h-12 px-3 pr-8 rounded-[var(--radius-sm)] border bg-slate-800/50 text-center font-display text-xl text-slate-100",
            colorMap[color] || colorMap.slate,
          )}
        />
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-meta text-slate-600 text-xs">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
