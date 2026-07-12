/**
 * prisma/seed-recipes.ts
 * Seeds the recipe catalog from the legacy FOOD_DB.
 * Run: npx tsx prisma/seed-recipes.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Top ~60 most-used foods from the legacy FOOD_DB, mapped to new schema
const RECIPES = [
  // PROT_ANIMAL_LEAN
  { name: "Petto di pollo", cat: "PROT_ANIMAL_LEAN", kcal: 165, p: 31, c: 0, f: 3.6, diets: ["ONNIVORO","PESCETARIANO"], excl: [] },
  { name: "Tacchino affettato", cat: "PROT_ANIMAL_LEAN", kcal: 99, p: 21, c: 0, f: 1.5, diets: ["ONNIVORO","PESCETARIANO"], excl: [] },
  { name: "Fesa di tacchino", cat: "PROT_ANIMAL_LEAN", kcal: 135, p: 30, c: 0, f: 1, diets: ["ONNIVORO","PESCETARIANO"], excl: [] },
  { name: "Manzo magro macinato", cat: "PROT_ANIMAL_LEAN", kcal: 137, p: 21, c: 0, f: 5.5, diets: ["ONNIVORO"], excl: [] },
  { name: "Bistecca di fassona", cat: "PROT_ANIMAL_LEAN", kcal: 140, p: 22, c: 0, f: 5, diets: ["ONNIVORO"], excl: [] },
  // FISH
  { name: "Salmone", cat: "FISH_FAT", kcal: 208, p: 20, c: 0, f: 13, diets: ["ONNIVORO","PESCETARIANO"], excl: ["pesce"] },
  { name: "Tonno al naturale", cat: "FISH_LEAN", kcal: 116, p: 26, c: 0, f: 1, diets: ["ONNIVORO","PESCETARIANO"], excl: ["pesce"] },
  { name: "Orata", cat: "FISH_LEAN", kcal: 100, p: 20, c: 0, f: 1.5, diets: ["ONNIVORO","PESCETARIANO"], excl: ["pesce"] },
  { name: "Branzino", cat: "FISH_LEAN", kcal: 97, p: 19, c: 0, f: 1.7, diets: ["ONNIVORO","PESCETARIANO"], excl: ["pesce"] },
  // EGGS
  { name: "Albume d'uovo", cat: "EGGS", kcal: 52, p: 11, c: 0.7, f: 0.2, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO"], excl: ["uova"] },
  { name: "Uovo intero", cat: "EGGS", kcal: 155, p: 13, c: 1.1, f: 11, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO"], excl: ["uova"] },
  // DAIRY
  { name: "Yogurt greco 0%", cat: "DAIRY_PROTEIN", kcal: 59, p: 10, c: 3.6, f: 0.4, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO"], excl: ["lattosio"] },
  { name: "Whey protein isolata", cat: "DAIRY_PROTEIN", kcal: 360, p: 90, c: 2, f: 1, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO"], excl: ["lattosio"] },
  { name: "Ricotta vaccina", cat: "DAIRY_PROTEIN", kcal: 174, p: 11, c: 3, f: 13, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO"], excl: ["lattosio"] },
  // LEGUMES
  { name: "Lenticchie cotte", cat: "LEGUMES", kcal: 116, p: 9, c: 20, f: 0.4, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Ceci cotti", cat: "LEGUMES", kcal: 164, p: 9, c: 27, f: 2.6, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Tofu naturale", cat: "PROT_VEG", kcal: 76, p: 8, c: 1.9, f: 4.8, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["soia"] },
  { name: "Tempeh", cat: "PROT_VEG", kcal: 192, p: 20, c: 8, f: 11, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["soia"] },
  { name: "Seitan", cat: "PROT_VEG", kcal: 250, p: 47, c: 14, f: 1.9, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["glutine"] },
  // GRAINS
  { name: "Riso basmati (crudo)", cat: "GRAINS_WHOLE", kcal: 350, p: 7, c: 78, f: 0.6, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Pasta integrale (cruda)", cat: "GRAINS_WHOLE", kcal: 350, p: 13, c: 72, f: 2.5, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["glutine"] },
  { name: "Fiocchi d'avena", cat: "GRAINS_WHOLE", kcal: 379, p: 13, c: 67, f: 7, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["glutine"] },
  { name: "Pane integrale", cat: "GRAINS_WHOLE", kcal: 250, p: 13, c: 43, f: 3.5, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["glutine"] },
  { name: "Riso venere (crudo)", cat: "GRAINS_WHOLE", kcal: 350, p: 8, c: 76, f: 1, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  // TUBERS
  { name: "Patate lesse", cat: "TUBERS", kcal: 82, p: 2, c: 17, f: 0.1, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Sweet potato", cat: "TUBERS", kcal: 86, p: 1.6, c: 20, f: 0.1, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  // VEG
  { name: "Broccoli", cat: "VEG", kcal: 34, p: 2.8, c: 7, f: 0.4, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Spinaci", cat: "VEG", kcal: 23, p: 2.9, c: 3.6, f: 0.4, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Zucchine", cat: "VEG", kcal: 17, p: 1.2, c: 3.1, f: 0.3, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Insalata mista", cat: "VEG", kcal: 15, p: 1.3, c: 2.2, f: 0.2, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Pomodoro", cat: "VEG", kcal: 18, p: 0.9, c: 3.9, f: 0.2, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  // FRUIT
  { name: "Banana", cat: "FRUIT", kcal: 89, p: 1.1, c: 23, f: 0.3, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Mela", cat: "FRUIT", kcal: 52, p: 0.3, c: 14, f: 0.2, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Frutti di bosco", cat: "FRUIT", kcal: 43, p: 0.7, c: 10, f: 0.3, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  // NUTS
  { name: "Mandorle", cat: "NUTS", kcal: 579, p: 21, c: 22, f: 50, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["frutta secca"] },
  { name: "Noci", cat: "NUTS", kcal: 654, p: 15, c: 14, f: 65, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["frutta secca"] },
  { name: "Burro di arachidi", cat: "NUTS", kcal: 588, p: 25, c: 20, f: 50, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["frutta secca"] },
  // FATS
  { name: "Olio EVO", cat: "FATS", kcal: 884, p: 0, c: 0, f: 100, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Avocado", cat: "FATS", kcal: 160, p: 2, c: 9, f: 15, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  // PLANT_MILK
  { name: "Bevanda di avena", cat: "PLANT_MILK", kcal: 40, p: 1, c: 6.5, f: 1.5, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["glutine"] },
  { name: "Latte vaccino scremato", cat: "DAIRY_PROTEIN", kcal: 34, p: 3.4, c: 5, f: 0.1, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO"], excl: ["lattosio"] },
  // SUPPLEMENTS
  { name: "Proteine vegetali isolate", cat: "SUPPLEMENTS", kcal: 360, p: 80, c: 5, f: 3, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  // CONDIMENTS
  { name: "Hummus", cat: "CONDIMENTS", kcal: 166, p: 8, c: 14, f: 10, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Marmellata light", cat: "CONDIMENTS", kcal: 50, p: 0.1, c: 12, f: 0, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Miele", cat: "CONDIMENTS", kcal: 304, p: 0.3, c: 82, f: 0, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Crema di mandorle", cat: "NUTS", kcal: 614, p: 21, c: 12, f: 54, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["frutta secca"] },
  // REFINED GRAINS
  { name: "Pasta di semola (cruda)", cat: "GRAINS_REFINED", kcal: 350, p: 12, c: 75, f: 1.5, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["glutine"] },
  { name: "Riso bianco (crudo)", cat: "GRAINS_REFINED", kcal: 350, p: 7, c: 80, f: 0.5, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: [] },
  { name: "Fette biscottate integrali", cat: "GRAINS_WHOLE", kcal: 267, p: 12, c: 49, f: 3.5, diets: ["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"], excl: ["glutine"] },
];

async function main() {
  console.log("Seeding recipe catalog...");

  // Clear existing global recipes
  await prisma.recipe.deleteMany({ where: { trainerId: null } });

  let count = 0;
  for (const r of RECIPES) {
    await prisma.recipe.create({
      data: {
        name: r.name,
        category: r.cat,
        kcalPer100g: r.kcal,
        proteinPer100g: r.p,
        carbPer100g: r.c,
        fatPer100g: r.f,
        dietTags: JSON.stringify(r.diets),
        allergens: JSON.stringify(r.excl),
      },
    });
    count++;
  }

  console.log(`Seeded ${count} recipes.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
