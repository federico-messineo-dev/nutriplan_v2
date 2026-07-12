"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Reorder } from "framer-motion";
import {
  Plus,
  Trash2,
  GripVertical,
  Utensils,
  Search,
} from "lucide-react";
import { PlanPDFDownload } from "@/components/plan-pdf";
import { Send } from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  category: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
  dietTags: string[];
  allergens: string[];
}

interface MealItem {
  id: string;
  recipeId: string;
  recipeName: string;
  grams: number;
}

interface Meal {
  id: string;
  name: string;
  items: MealItem[];
}

interface PlanData {
  meals: Meal[];
  rules: string;
}

const MEAL_SLOTS = ["Colazione", "Spuntino Mattina", "Pranzo", "Spuntino Pomeriggio", "Cena"];

function calcMealMacros(items: MealItem[], recipes: Recipe[]) {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  let kcal = 0, p = 0, c = 0, f = 0;
  for (const item of items) {
    const r = byId.get(item.recipeId);
    if (!r) continue;
    const factor = item.grams / 100;
    kcal += r.kcalPer100g * factor;
    p += r.proteinPer100g * factor;
    c += r.carbPer100g * factor;
    f += r.fatPer100g * factor;
  }
  return { kcal: Math.round(kcal), p: Math.round(p), c: Math.round(c), f: Math.round(f) };
}

function RecipePicker({
  recipes,
  onSelect,
  exclusions,
  onClose,
}: {
  recipes: Recipe[];
  onSelect: (recipe: Recipe) => void;
  exclusions: string[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return recipes.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.category.toLowerCase().includes(q)) return false;
      const rAllergens = r.allergens || [];
      if (exclusions.some((e) => rAllergens.includes(e))) return false;
      return true;
    });
  }, [recipes, search, exclusions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 ">
      <div className="bg-slate-900/80 border border-slate-700/50 rounded-[var(--radius-lg)] shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Cerca alimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent text-sm font-body text-slate-100 outline-none placeholder:text-slate-500"
            />
            <button onClick={onClose} className="text-slate-400 hover:text-slate-100 text-xs">
              Esc
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">Nessun alimento trovato.</p>
          )}
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onSelect(r);
                onClose();
              }}
              className="w-full text-left px-3 py-2.5 rounded-[var(--radius-sm)] hover:bg-slate-800/50 transition-colors"
            >
              <p className="font-body text-sm text-slate-100">{r.name}</p>
              <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                {r.kcalPer100g} kcal · P{r.proteinPer100g} · C{r.carbPer100g} · F{r.fatPer100g} /100g
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlanBuilder({
  client,
  onSaved,
}: {
  client: {
    id: string;
    fullName: string;
    exclusions: string;
    diet: string;
    startWeightKg: number | null;
  };
  onSaved: () => void;
}) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plan, setPlan] = useState<PlanData>({
    meals: MEAL_SLOTS.map((name, i) => ({
      id: `meal-${i}`,
      name,
      items: [],
    })),
    rules: "",
  });
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const exclusions = useMemo(
    () => JSON.parse(client.exclusions || "[]") as string[],
    [client.exclusions],
  );

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((d) => setRecipes(d.recipes || []));
  }, []);

  const totals = useMemo(() => {
    const allItems = plan.meals.flatMap((m) => m.items);
    return calcMealMacros(allItems, recipes);
  }, [plan.meals, recipes]);

  const addMeal = () => {
    setPlan((p) => ({
      ...p,
      meals: [
        ...p.meals,
        {
          id: `meal-${Date.now()}`,
          name: `Spuntino ${p.meals.length + 1}`,
          items: [],
        },
      ],
    }));
  };

  const removeMeal = (mealId: string) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals.filter((m) => m.id !== mealId),
    }));
  };

  const renameMeal = (mealId: string, name: string) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals.map((m) => (m.id === mealId ? { ...m, name } : m)),
    }));
  };

  const addItem = (mealId: string, recipe: Recipe) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals.map((m) =>
        m.id === mealId
          ? {
              ...m,
              items: [
                ...m.items,
                {
                  id: `item-${Date.now()}`,
                  recipeId: recipe.id,
                  recipeName: recipe.name,
                  grams: 100,
                },
              ],
            }
          : m,
      ),
    }));
  };

  const updateGrams = (mealId: string, itemId: string, grams: number) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals.map((m) =>
        m.id === mealId
          ? {
              ...m,
              items: m.items.map((it) =>
                it.id === itemId ? { ...it, grams } : it,
              ),
            }
          : m,
      ),
    }));
  };

  const removeItem = (mealId: string, itemId: string) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals.map((m) =>
        m.id === mealId
          ? { ...m, items: m.items.filter((it) => it.id !== itemId) }
          : m,
      ),
    }));
  };

  const reorderItems = (mealId: string, newItems: MealItem[]) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals.map((m) =>
        m.id === mealId ? { ...m, items: newItems } : m,
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/clients/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: client.id,
        text: `[PLAN_V2] ${JSON.stringify(plan)}`,
      }),
    });
    setSaving(false);
    onSaved();
  };

  const handleSendPDF = async () => {
    const { pdf } = await import("@react-pdf/renderer");
    const { PlanPDF } = await import("@/components/plan-pdf");
    const blob = await pdf(
      <PlanPDF
        data={{
          clientName: client.fullName || "Cliente",
          meals: plan.meals,
          rules: plan.rules,
          recipes: recipes,
          targets: { kcal: 2000, p: 120, c: 200, f: 60 },
        }}
      />
    ).toBlob();
    const file = new File([blob], `piano-${(client.fullName || "cliente").toLowerCase().replace(/\s+/g, "-")}.pdf`, { type: "application/pdf" });
    if (navigator.share) {
      try {
        await navigator.share({ files: [file], title: "Piano alimentare NutriPlan" });
      } catch { /* user cancelled */ }
    } else {
      const url = URL.createObjectURL(blob);
      window.open(`https://wa.me/?text=${encodeURIComponent("Ecco il tuo piano alimentare NutriPlan 🍽️")}&url=${encodeURIComponent(url)}`, "_blank");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-slate-100 text-center">Piano alimentare</h2>
        <div className="flex items-center gap-2">
          <PlanPDFDownload
            data={{
              clientName: client.fullName || "Cliente",
              meals: plan.meals,
              rules: plan.rules,
              recipes: recipes,
              targets: { kcal: 2000, p: 120, c: 200, f: 60 },
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

      {/* Totals bar */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-4">
        <div className="flex items-center justify-around text-center">
          <MacroPill label="Kcal" value={totals.kcal} color="text-cyan-400" />
          <MacroPill label="Proteine" value={totals.p} unit="g" color="text-green-400" />
          <MacroPill label="Carboidrati" value={totals.c} unit="g" color="text-purple-400" />
          <MacroPill label="Grassi" value={totals.f} unit="g" color="text-slate-300" />
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        {plan.meals.map((meal) => {
          const macros = calcMealMacros(meal.items, recipes);
          return (
            <div
              key={meal.id}
              className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] overflow-hidden"
            >
              {/* Meal header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/30">
                <Utensils size={14} className="text-slate-500" />
                <input
                  type="text"
                  value={meal.name}
                  onChange={(e) => renameMeal(meal.id, e.target.value)}
                  className="flex-1 font-body text-sm font-medium text-slate-100 bg-transparent outline-none"
                />
                <span className="font-mono text-[10px] text-slate-500">
                  {macros.kcal} kcal
                </span>
                <button
                  onClick={() => removeMeal(meal.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Items */}
              <div className="p-3 space-y-2">
                {meal.items.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-2">
                    Nessun alimento — clicca + per aggiungere
                  </p>
                )}
                <Reorder.Group
                  axis="y"
                  values={meal.items}
                  onReorder={(newItems) => reorderItems(meal.id, newItems)}
                  className="space-y-1"
                >
                  {meal.items.map((item) => {
                    const recipe = recipes.find((r) => r.id === item.recipeId);
                    const itemKcal = recipe
                      ? Math.round((recipe.kcalPer100g * item.grams) / 100)
                      : 0;
                    return (
                      <Reorder.Item
                        key={item.id}
                        value={item}
                        className="flex items-center gap-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-slate-800/30 transition-colors"
                      >
                        <GripVertical size={12} className="text-slate-600 cursor-grab shrink-0" />
                        <span className="flex-1 font-body text-sm text-slate-200 truncate">
                          {item.recipeName}
                        </span>
                        <input
                          type="number"
                          value={item.grams}
                          onChange={(e) =>
                            updateGrams(meal.id, item.id, parseInt(e.target.value) || 0)
                          }
                          className="w-16 h-7 px-2 text-center rounded border border-slate-700/50 bg-slate-800/50 text-xs font-mono text-slate-100"
                        />
                        <span className="font-meta text-[10px] text-slate-600 w-6">g</span>
                        <span className="font-mono text-[10px] text-slate-500 w-12 text-right">
                          {itemKcal} kcal
                        </span>
                        <button
                          onClick={() => removeItem(meal.id, item.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>

              {/* Add food button */}
              <div className="px-3 pb-3">
                <button
                  onClick={() => setPickerOpen(meal.id)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Plus size={12} />
                  Aggiungi alimento
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add meal */}
      <button
        onClick={addMeal}
        className="w-full py-3 border-2 border-dashed border-slate-700/50 rounded-[var(--radius-md)] text-sm text-slate-500 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors"
      >
        + Aggiungi pasto
      </button>

      {/* Rules */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-[var(--radius-md)] p-4">
        <label className="font-meta text-slate-500 text-xs">Regole / integrazioni</label>
        <textarea
          rows={3}
          value={plan.rules}
          onChange={(e) => setPlan((p) => ({ ...p, rules: e.target.value }))}
          placeholder="Esempio: Bevi 2L di acqua. Integratore vitamina D3 2000UI/die."
          className="mt-2 w-full px-3 py-2 rounded-[var(--radius-sm)] border border-slate-700/50 bg-slate-800/50 text-sm font-body text-slate-100 resize-none placeholder:text-slate-600"
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="h-10 px-6 rounded-[var(--radius-sm)] bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 shadow-sm shadow-cyan-500/20"
      >
        {saving ? "Salvataggio..." : "Salva piano"}
      </button>

      {/* Recipe picker modal */}
      {pickerOpen && (
        <RecipePicker
          recipes={recipes}
          exclusions={exclusions}
          onSelect={(recipe) => addItem(pickerOpen, recipe)}
          onClose={() => setPickerOpen(null)}
        />
      )}
    </div>
  );
}

function MacroPill({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit?: string;
  color: string;
}) {
  return (
    <div>
      <p className="font-meta text-slate-500">{label}</p>
      <p className={cn("font-display text-xl", color)}>{value}</p>
      {unit && <p className="font-meta text-slate-600">{unit}</p>}
    </div>
  );
}
