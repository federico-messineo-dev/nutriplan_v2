"use client";

import { PDFDownloadLink, PDFViewer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface Recipe {
  id: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
}

interface MealItem {
  recipeId: string;
  recipeName: string;
  grams: number;
}

interface Meal {
  name: string;
  items: MealItem[];
}

interface PlanPDFData {
  clientName: string;
  meals: Meal[];
  rules: string;
  recipes: Recipe[];
  targets: { kcal: number; p: number; c: number; f: number };
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#06b6d4",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
  },
  clientName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
  },
  targetsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 4,
  },
  targetItem: {
    alignItems: "center",
  },
  targetLabel: {
    fontSize: 8,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  targetValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  mealSection: {
    marginBottom: 18,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  mealName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#06b6d4",
  },
  mealKcal: {
    fontSize: 9,
    color: "#888",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingLeft: 10,
  },
  itemName: {
    flex: 1,
    fontSize: 10,
  },
  itemGrams: {
    width: 60,
    textAlign: "right",
    fontSize: 10,
    color: "#666",
  },
  itemKcal: {
    width: 60,
    textAlign: "right",
    fontSize: 10,
    color: "#888",
  },
  totalsSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: "#06b6d4",
  },
  totalsTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  totalItem: {
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 8,
    color: "#888",
    textTransform: "uppercase",
  },
  totalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  rulesSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
  },
  rulesTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  rulesText: {
    fontSize: 9,
    color: "#666",
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    fontSize: 8,
    color: "#aaa",
    textAlign: "center",
  },
});

function calcItemKcal(item: MealItem, recipes: Recipe[]): number {
  const r = recipes.find((rec) => rec.id === item.recipeId);
  if (!r) return 0;
  return Math.round((r.kcalPer100g * item.grams) / 100);
}

function calcMealKcal(meal: Meal, recipes: Recipe[]): number {
  return meal.items.reduce((sum, item) => sum + calcItemKcal(item, recipes), 0);
}

export function PlanPDF({ data }: { data: PlanPDFData }) {
  const totalKcal = data.meals.reduce((sum, m) => sum + calcMealKcal(m, data.recipes), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Piano Alimentare</Text>
          <Text style={styles.subtitle}>NutriPlan Pro</Text>
          <Text style={styles.clientName}>{data.clientName}</Text>
        </View>

        {/* Targets */}
        <View style={styles.targetsRow}>
          <View style={styles.targetItem}>
            <Text style={styles.targetLabel}>Target</Text>
            <Text style={styles.targetValue}>{data.targets.kcal} kcal</Text>
          </View>
          <View style={styles.targetItem}>
            <Text style={styles.targetLabel}>Proteine</Text>
            <Text style={styles.targetValue}>{data.targets.p}g</Text>
          </View>
          <View style={styles.targetItem}>
            <Text style={styles.targetLabel}>Carboidrati</Text>
            <Text style={styles.targetValue}>{data.targets.c}g</Text>
          </View>
          <View style={styles.targetItem}>
            <Text style={styles.targetLabel}>Grassi</Text>
            <Text style={styles.targetValue}>{data.targets.f}g</Text>
          </View>
        </View>

        {/* Meals */}
        {data.meals.map((meal, i) => (
          <View key={i} style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealKcal}>{calcMealKcal(meal, data.recipes)} kcal</Text>
            </View>
            {meal.items.map((item, j) => (
              <View key={j} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.recipeName}</Text>
                <Text style={styles.itemGrams}>{item.grams}g</Text>
                <Text style={styles.itemKcal}>{calcItemKcal(item, data.recipes)} kcal</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <Text style={styles.totalsTitle}>Totali giornalieri</Text>
          <View style={styles.totalsRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Totale</Text>
              <Text style={styles.totalValue}>{totalKcal} kcal</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Target</Text>
              <Text style={styles.totalValue}>{data.targets.kcal} kcal</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalLabel}>Diff</Text>
              <Text style={styles.totalValue}>
                {totalKcal - data.targets.kcal > 0 ? "+" : ""}
                {totalKcal - data.targets.kcal} kcal
              </Text>
            </View>
          </View>
        </View>

        {/* Rules */}
        {data.rules && (
          <View style={styles.rulesSection}>
            <Text style={styles.rulesTitle}>Regole e integrazioni</Text>
            <Text style={styles.rulesText}>{data.rules}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generato con NutriPlan Pro — {new Date().toLocaleDateString("it-IT")}
        </Text>
      </Page>
    </Document>
  );
}

export function PlanPDFDownload({
  data,
  disabled,
}: {
  data: PlanPDFData;
  disabled?: boolean;
}) {
  return (
    <PDFDownloadLink
      document={<PlanPDF data={data} />}
      fileName={`piano-${data.clientName.toLowerCase().replace(/\s+/g, "-")}.pdf`}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] bg-slate-800/50 border border-slate-700/50 text-xs font-body text-slate-400 hover:text-slate-100 transition-colors"
    >
      {({ loading }) => (loading ? "Generazione..." : "Scarica PDF")}
    </PDFDownloadLink>
  );
}

export function PlanPDFPreview({ data }: { data: PlanPDFData }) {
  return (
    <PDFViewer width="100%" height={600}>
      <PlanPDF data={data} />
    </PDFViewer>
  );
}
