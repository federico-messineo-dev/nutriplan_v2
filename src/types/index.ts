// Shared types for NutriPlan Pro

export type Goal = "CUT" | "MAINTAIN" | "BULK" | "RECOMP";
export type Diet = "ONNIVORO" | "PESCETARIANO" | "VEGETARIANO" | "VEGANO";
export type Sex = "M" | "F";
export type ClientStatus = "ACTIVE" | "PAUSED" | "CHURNED";
export type PlanStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type MealSlot = "COLAZIONE" | "SPUNTINO_MATTINA" | "PRANZO" | "SPUNTINO_POMERIGGIO" | "CENA";

export type FoodCategory =
  | "PROT_ANIMAL_LEAN" | "FISH_LEAN" | "FISH_FAT" | "EGGS"
  | "DAIRY_PROTEIN" | "CHEESE" | "PROT_VEG" | "LEGUMES"
  | "GRAINS_WHOLE" | "GRAINS_REFINED" | "TUBERS" | "VEG"
  | "FRUIT" | "NUTS" | "FATS" | "PLANT_MILK"
  | "SNACKS" | "SUPPLEMENTS" | "CONDIMENTS";

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  PROT_ANIMAL_LEAN: "Proteine animali magre",
  FISH_LEAN: "Pesce magro",
  FISH_FAT: "Pesce grasso",
  EGGS: "Uova",
  DAIRY_PROTEIN: "Proteine lattiere",
  CHEESE: "Formaggi",
  PROT_VEG: "Proteine vegetali",
  LEGUMES: "Legumi",
  GRAINS_WHOLE: "Cereali integrali",
  GRAINS_REFINED: "Cereali raffinati",
  TUBERS: "Tuberi",
  VEG: "Verdure",
  FRUIT: "Frutta",
  NUTS: "Frutta secca",
  FATS: "Grassi",
  PLANT_MILK: "Latte vegetale",
  SNACKS: "Snack",
  SUPPLEMENTS: "Integratori",
  CONDIMENTS: "Condimenti",
};
