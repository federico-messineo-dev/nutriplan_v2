export const TRAINER_ID = "trainer_001";

export const mockTrainer = {
  id: TRAINER_ID,
  email: "trainer@nutriplan.local",
  fullName: "Alberto Iocca",
  businessName: "NutriPlan Pro",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const NOW = new Date("2026-07-12");

export const mockClients = [
  {
    id: "c1a2b3c4d5e",
    trainerId: TRAINER_ID,
    fullName: "Marco Bianchi",
    phoneNumberE164: "+393331234567",
    email: null,
    status: "ACTIVE",
    sex: "M",
    age: 34,
    heightCm: 182,
    startWeightKg: 96.5,
    exclusions: JSON.stringify(["lattosio"]),
    diet: "ONNIVORO",
    activityFactor: 1.725,
    goal: "CUT",
    trainingDaysWk: 4,
    waterTargetL: 2.5,
    bmrManualKcal: null,
    tdeeManualKcal: null,
    mealDistribution: null,
    medicalNotes: null,
    createdAt: new Date("2025-09-01"),
    updatedAt: new Date("2026-07-01"),
    _count: { checkIns: 12, dietPlans: 3 },
  },
  {
    id: "c2f3g4h5i6j",
    trainerId: TRAINER_ID,
    fullName: "Giulia Verdi",
    phoneNumberE164: "+393337654321",
    email: null,
    status: "ACTIVE",
    sex: "F",
    age: 28,
    heightCm: 165,
    startWeightKg: 62.0,
    exclusions: "[]",
    diet: "VEGETARIANO",
    activityFactor: 1.55,
    goal: "MAINTAIN",
    trainingDaysWk: 3,
    waterTargetL: 2.0,
    bmrManualKcal: null,
    tdeeManualKcal: null,
    mealDistribution: null,
    medicalNotes: null,
    createdAt: new Date("2025-10-15"),
    updatedAt: new Date("2026-07-01"),
    _count: { checkIns: 8, dietPlans: 1 },
  },
  {
    id: "c3k4l5m6n7o",
    trainerId: TRAINER_ID,
    fullName: "Luca Russo",
    phoneNumberE164: "+393339876543",
    email: null,
    status: "ACTIVE",
    sex: "M",
    age: 42,
    heightCm: 175,
    startWeightKg: 88.0,
    exclusions: JSON.stringify(["soia"]),
    diet: "ONNIVORO",
    activityFactor: 1.375,
    goal: "BULK",
    trainingDaysWk: 3,
    waterTargetL: 2.5,
    bmrManualKcal: 1800,
    tdeeManualKcal: null,
    mealDistribution: null,
    medicalNotes: null,
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-07-01"),
    _count: { checkIns: 6, dietPlans: 1 },
  },
];

export const mockCheckIns = [
  // Marco — 11 measurements + 1 note
  { id: "m1a2b3c4d1", clientId: "c1a2b3c4d5e", weightKg: 96.5, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "Peso iniziale", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2025-09-15") },
  { id: "m1a2b3c4d2", clientId: "c1a2b3c4d5e", weightKg: 94.2, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2025-10-15") },
  { id: "m1a2b3c4d3", clientId: "c1a2b3c4d5e", weightKg: 92.8, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "Buon trend", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2025-11-15") },
  { id: "m1a2b3c4d4", clientId: "c1a2b3c4d5e", weightKg: 91.1, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2025-12-15") },
  { id: "m1a2b3c4d5", clientId: "c1a2b3c4d5e", weightKg: 89.4, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "Ottimo lavoro, 7 kg persi", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-01-15") },
  { id: "m1a2b3c4d6", clientId: "c1a2b3c4d5e", weightKg: 88.2, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-02-15") },
  { id: "m1a2b3c4d7", clientId: "c1a2b3c4d5e", weightKg: 87.0, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "Rallentamento", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-03-15") },
  { id: "m1a2b3c4d8", clientId: "c1a2b3c4d5e", weightKg: 86.1, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-04-15") },
  { id: "m1a2b3c4d9", clientId: "c1a2b3c4d5e", weightKg: 85.3, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "Tornato a calare", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-05-15") },
  { id: "m1a2b3c4d10", clientId: "c1a2b3c4d5e", weightKg: 84.5, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-06-15") },
  { id: "m1a2b3c4d11", clientId: "c1a2b3c4d5e", weightKg: 84.0, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "Ultima before summer", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-07-01") },
  { id: "m1note1", clientId: "c1a2b3c4d5e", weightKg: null, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: "Cliente motivato, vuole perdere 10-12 kg. Allergia lattosio. Allena 4x/week push/pull/legs/upper.", photoUrls: "[]", source: "MANUAL", createdAt: new Date("2025-09-15") },
  // Giulia
  { id: "m2a2b3c4d1", clientId: "c2f3g4h5i6j", weightKg: 62.0, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2025-11-02") },
  { id: "m2a2b3c4d2", clientId: "c2f3g4h5i6j", weightKg: 61.8, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2025-12-02") },
  { id: "m2a2b3c4d3", clientId: "c2f3g4h5i6j", weightKg: 61.5, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-01-10") },
  { id: "m2a2b3c4d4", clientId: "c2f3g4h5i6j", weightKg: 61.3, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-02-10") },
  { id: "m2a2b3c4d5", clientId: "c2f3g4h5i6j", weightKg: 61.0, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-03-10") },
  { id: "m2a2b3c4d6", clientId: "c2f3g4h5i6j", weightKg: 61.2, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-04-14") },
  { id: "m2a2b3c4d7", clientId: "c2f3g4h5i6j", weightKg: 61.0, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-05-12") },
  { id: "m2a2b3c4d8", clientId: "c2f3g4h5i6j", weightKg: 60.8, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-06-15") },
  // Luca
  { id: "m3a2b3c4d1", clientId: "c3k4l5m6n7o", weightKg: 88.0, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-01-20") },
  { id: "m3a2b3c4d2", clientId: "c3k4l5m6n7o", weightKg: 88.8, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-02-17") },
  { id: "m3a2b3c4d3", clientId: "c3k4l5m6n7o", weightKg: 89.6, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-03-17") },
  { id: "m3a2b3c4d4", clientId: "c3k4l5m6n7o", weightKg: 90.2, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-04-14") },
  { id: "m3a2b3c4d5", clientId: "c3k4l5m6n7o", weightKg: 91.0, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-05-12") },
  { id: "m3a2b3c4d6", clientId: "c3k4l5m6n7o", weightKg: 91.8, sleepHours: null, stressLevel: null, energyLevel: null, adherencePct: null, notes: null, photoUrls: "[]", source: "MANUAL", createdAt: new Date("2026-06-16") },
];

export const mockRecipes = [
  { id: "r_prot_01", trainerId: null, name: "Petto di pollo", category: "PROT_ANIMAL_LEAN", kcalPer100g: 165, proteinPer100g: 31, carbPer100g: 0, fatPer100g: 4, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_prot_02", trainerId: null, name: "Tacchino affettato", category: "PROT_ANIMAL_LEAN", kcalPer100g: 99, proteinPer100g: 21, carbPer100g: 0, fatPer100g: 2, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_prot_03", trainerId: null, name: "Fesa di tacchino", category: "PROT_ANIMAL_LEAN", kcalPer100g: 135, proteinPer100g: 30, carbPer100g: 0, fatPer100g: 1, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_prot_04", trainerId: null, name: "Manzo magro macinato", category: "PROT_ANIMAL_LEAN", kcalPer100g: 137, proteinPer100g: 21, carbPer100g: 0, fatPer100g: 6, dietTags: JSON.stringify(["ONNIVORO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_prot_05", trainerId: null, name: "Bistecca di fassona", category: "PROT_ANIMAL_LEAN", kcalPer100g: 140, proteinPer100g: 22, carbPer100g: 0, fatPer100g: 5, dietTags: JSON.stringify(["ONNIVORO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_fish_01", trainerId: null, name: "Salmone", category: "FISH_FAT", kcalPer100g: 208, proteinPer100g: 20, carbPer100g: 0, fatPer100g: 13, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO"]), allergens: JSON.stringify(["pesce"]), instructions: null },
  { id: "r_fish_02", trainerId: null, name: "Tonno al naturale", category: "FISH_LEAN", kcalPer100g: 116, proteinPer100g: 26, carbPer100g: 0, fatPer100g: 1, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO"]), allergens: JSON.stringify(["pesce"]), instructions: null },
  { id: "r_fish_03", trainerId: null, name: "Orata", category: "FISH_LEAN", kcalPer100g: 100, proteinPer100g: 20, carbPer100g: 0, fatPer100g: 2, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO"]), allergens: JSON.stringify(["pesce"]), instructions: null },
  { id: "r_egg_01", trainerId: null, name: "Albume d'uovo", category: "EGGS", kcalPer100g: 52, proteinPer100g: 11, carbPer100g: 1, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO"]), allergens: JSON.stringify(["uova"]), instructions: null },
  { id: "r_egg_02", trainerId: null, name: "Uovo intero", category: "EGGS", kcalPer100g: 155, proteinPer100g: 13, carbPer100g: 1, fatPer100g: 11, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO"]), allergens: JSON.stringify(["uova"]), instructions: null },
  { id: "r_dairy_01", trainerId: null, name: "Yogurt greco 0%", category: "DAIRY_PROTEIN", kcalPer100g: 59, proteinPer100g: 10, carbPer100g: 4, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO"]), allergens: JSON.stringify(["lattosio"]), instructions: null },
  { id: "r_dairy_02", trainerId: null, name: "Whey protein isolata", category: "DAIRY_PROTEIN", kcalPer100g: 360, proteinPer100g: 90, carbPer100g: 2, fatPer100g: 1, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO"]), allergens: JSON.stringify(["lattosio"]), instructions: null },
  { id: "r_dairy_03", trainerId: null, name: "Ricotta vaccina", category: "DAIRY_PROTEIN", kcalPer100g: 174, proteinPer100g: 11, carbPer100g: 3, fatPer100g: 13, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO"]), allergens: JSON.stringify(["lattosio"]), instructions: null },
  { id: "r_leg_01", trainerId: null, name: "Lenticchie secche", category: "LEGUMES", kcalPer100g: 116, proteinPer100g: 9, carbPer100g: 20, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_leg_02", trainerId: null, name: "Ceci cotti", category: "LEGUMES", kcalPer100g: 139, proteinPer100g: 7, carbPer100g: 22, fatPer100g: 3, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_grain_01", trainerId: null, name: "Riso basmati", category: "GRAINS_REFINED", kcalPer100g: 130, proteinPer100g: 3, carbPer100g: 28, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_grain_02", trainerId: null, name: "Pasta di semola", category: "GRAINS_REFINED", kcalPer100g: 158, proteinPer100g: 6, carbPer100g: 30, fatPer100g: 1, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify(["glutine"]), instructions: null },
  { id: "r_grain_03", trainerId: null, name: "Avena in fiocchi", category: "GRAINS_WHOLE", kcalPer100g: 379, proteinPer100g: 14, carbPer100g: 63, fatPer100g: 7, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify(["glutine"]), instructions: null },
  { id: "r_grain_04", trainerId: null, name: "Pane integrale", category: "GRAINS_WHOLE", kcalPer100g: 247, proteinPer100g: 9, carbPer100g: 45, fatPer100g: 3, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify(["glutine"]), instructions: null },
  { id: "r_tub_01", trainerId: null, name: "Patate", category: "TUBERS", kcalPer100g: 77, proteinPer100g: 2, carbPer100g: 17, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_tub_02", trainerId: null, name: "Patate dolci", category: "TUBERS", kcalPer100g: 86, proteinPer100g: 2, carbPer100g: 20, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_veg_01", trainerId: null, name: "Spinaci", category: "VEG", kcalPer100g: 23, proteinPer100g: 3, carbPer100g: 4, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_veg_02", trainerId: null, name: "Zucchine", category: "VEG", kcalPer100g: 17, proteinPer100g: 1, carbPer100g: 3, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_veg_03", trainerId: null, name: "Broccoli", category: "VEG", kcalPer100g: 34, proteinPer100g: 3, carbPer100g: 7, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_fruit_01", trainerId: null, name: "Banana", category: "FRUIT", kcalPer100g: 89, proteinPer100g: 1, carbPer100g: 23, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_fruit_02", trainerId: null, name: "Mela", category: "FRUIT", kcalPer100g: 52, proteinPer100g: 0, carbPer100g: 14, fatPer100g: 0, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_nut_01", trainerId: null, name: "Mandorle", category: "NUTS", kcalPer100g: 579, proteinPer100g: 21, carbPer100g: 22, fatPer100g: 50, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify(["frutta a guscio"]), instructions: null },
  { id: "r_nut_02", trainerId: null, name: "Noci", category: "NUTS", kcalPer100g: 654, proteinPer100g: 15, carbPer100g: 14, fatPer100g: 65, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify(["frutta a guscio"]), instructions: null },
  { id: "r_fat_01", trainerId: null, name: "Olio d'oliva", category: "FATS", kcalPer100g: 884, proteinPer100g: 0, carbPer100g: 0, fatPer100g: 100, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
  { id: "r_fat_02", trainerId: null, name: "Avocado", category: "FATS", kcalPer100g: 160, proteinPer100g: 2, carbPer100g: 9, fatPer100g: 15, dietTags: JSON.stringify(["ONNIVORO","PESCETARIANO","VEGETARIANO","VEGANO"]), allergens: JSON.stringify([]), instructions: null },
];

export const mockExercises = [
  { id: "ex_01", trainerId: null, name: "Panca piana bilanciere", muscleGroup: "Petto", equipment: "Bilanciere", videoUrl: null, substitutionGroup: "spinta_orizzontale" },
  { id: "ex_02", trainerId: null, name: "Panca inclinata manubri", muscleGroup: "Petto", equipment: "Manubri", videoUrl: null, substitutionGroup: "spinta_orizzontale" },
  { id: "ex_03", trainerId: null, name: "Spinte con manubri su panca 30°", muscleGroup: "Petto", equipment: "Manubri", videoUrl: null, substitutionGroup: "spinta_inclinata" },
  { id: "ex_04", trainerId: null, name: "Chest fly al cavo", muscleGroup: "Petto", equipment: "Cavo", videoUrl: null, substitutionGroup: "aperture" },
  { id: "ex_05", trainerId: null, name: "Lat machine avanti", muscleGroup: "Dorso", equipment: "Cavo", videoUrl: null, substitutionGroup: "trazione_verticale" },
  { id: "ex_06", trainerId: null, name: "Rematore bilanciere", muscleGroup: "Dorso", equipment: "Bilanciere", videoUrl: null, substitutionGroup: "trazione_orizzontale" },
  { id: "ex_07", trainerId: null, name: "Pulley basso", muscleGroup: "Dorso", equipment: "Cavo", videoUrl: null, substitutionGroup: "trazione_orizzontale" },
  { id: "ex_08", trainerId: null, name: "Squat", muscleGroup: "Gambe", equipment: "Bilanciere", videoUrl: null, substitutionGroup: "squat" },
  { id: "ex_09", trainerId: null, name: "Leg press", muscleGroup: "Gambe", equipment: "Macchina", videoUrl: null, substitutionGroup: "spinta_gambe" },
  { id: "ex_10", trainerId: null, name: "Bulgarian split squat", muscleGroup: "Gambe", equipment: "Manubri", videoUrl: null, substitutionGroup: "squat" },
  { id: "ex_11", trainerId: null, name: "Shoulder press manubri", muscleGroup: "Spalle", equipment: "Manubri", videoUrl: null, substitutionGroup: "spinta_verticale" },
  { id: "ex_12", trainerId: null, name: "Alzate laterali", muscleGroup: "Spalle", equipment: "Manubri", videoUrl: null, substitutionGroup: "alzate" },
  { id: "ex_13", trainerId: null, name: "Curl bilanciere", muscleGroup: "Bicipiti", equipment: "Bilanciere", videoUrl: null, substitutionGroup: "curl" },
  { id: "ex_14", trainerId: null, name: "Pushdown", muscleGroup: "Tricipiti", equipment: "Cavo", videoUrl: null, substitutionGroup: "pushdown" },
  { id: "ex_15", trainerId: null, name: "Crunch", muscleGroup: "Addominali", equipment: "Peso corpo", videoUrl: null, substitutionGroup: "core" },
];

export const mockMeals = [
  { id: "ml_01", dietPlanId: "dp_01", dayOfWeek: 1, slot: "COLAZIONE", recipeId: "r_dairy_02", customLabel: null, grams: 40, kcal: 144, proteinG: 36, carbG: 1, fatG: 0 },
  { id: "ml_02", dietPlanId: "dp_01", dayOfWeek: 1, slot: "COLAZIONE", recipeId: "r_grain_03", customLabel: null, grams: 80, kcal: 303, proteinG: 11, carbG: 50, fatG: 6 },
  { id: "ml_03", dietPlanId: "dp_01", dayOfWeek: 1, slot: "PRANZO", recipeId: "r_prot_01", customLabel: null, grams: 200, kcal: 330, proteinG: 62, carbG: 0, fatG: 7 },
  { id: "ml_04", dietPlanId: "dp_01", dayOfWeek: 1, slot: "PRANZO", recipeId: "r_grain_01", customLabel: null, grams: 250, kcal: 325, proteinG: 7, carbG: 70, fatG: 1 },
  { id: "ml_05", dietPlanId: "dp_01", dayOfWeek: 1, slot: "PRANZO", recipeId: "r_veg_03", customLabel: null, grams: 150, kcal: 51, proteinG: 4, carbG: 11, fatG: 1 },
  { id: "ml_06", dietPlanId: "dp_01", dayOfWeek: 1, slot: "CENA", recipeId: "r_fish_01", customLabel: null, grams: 180, kcal: 374, proteinG: 36, carbG: 0, fatG: 23 },
  { id: "ml_07", dietPlanId: "dp_01", dayOfWeek: 1, slot: "CENA", recipeId: "r_tub_01", customLabel: null, grams: 200, kcal: 154, proteinG: 4, carbG: 34, fatG: 0 },
  { id: "ml_08", dietPlanId: "dp_01", dayOfWeek: 1, slot: "CENA", recipeId: "r_veg_01", customLabel: null, grams: 100, kcal: 23, proteinG: 3, carbG: 4, fatG: 0 },
  { id: "ml_09", dietPlanId: "dp_02", dayOfWeek: 1, slot: "COLAZIONE", recipeId: "r_dairy_01", customLabel: null, grams: 200, kcal: 118, proteinG: 20, carbG: 7, fatG: 1 },
  { id: "ml_10", dietPlanId: "dp_02", dayOfWeek: 1, slot: "COLAZIONE", recipeId: "r_fruit_02", customLabel: null, grams: 150, kcal: 78, proteinG: 0, carbG: 21, fatG: 0 },
  { id: "ml_11", dietPlanId: "dp_02", dayOfWeek: 1, slot: "PRANZO", recipeId: "r_leg_01", customLabel: null, grams: 200, kcal: 232, proteinG: 18, carbG: 40, fatG: 1 },
  { id: "ml_12", dietPlanId: "dp_02", dayOfWeek: 1, slot: "PRANZO", recipeId: "r_grain_02", customLabel: null, grams: 200, kcal: 316, proteinG: 12, carbG: 60, fatG: 2 },
  { id: "ml_13", dietPlanId: "dp_02", dayOfWeek: 1, slot: "CENA", recipeId: "r_egg_02", customLabel: null, grams: 120, kcal: 186, proteinG: 16, carbG: 1, fatG: 13 },
  { id: "ml_14", dietPlanId: "dp_02", dayOfWeek: 1, slot: "CENA", recipeId: "r_veg_02", customLabel: null, grams: 200, kcal: 34, proteinG: 2, carbG: 6, fatG: 1 },
  { id: "ml_15", dietPlanId: "dp_02", dayOfWeek: 1, slot: "CENA", recipeId: "r_tub_01", customLabel: null, grams: 150, kcal: 116, proteinG: 3, carbG: 26, fatG: 0 },
  { id: "ml_16", dietPlanId: "dp_03", dayOfWeek: 1, slot: "COLAZIONE", recipeId: "r_egg_02", customLabel: null, grams: 100, kcal: 155, proteinG: 13, carbG: 1, fatG: 11 },
  { id: "ml_17", dietPlanId: "dp_03", dayOfWeek: 1, slot: "COLAZIONE", recipeId: "r_grain_03", customLabel: null, grams: 100, kcal: 379, proteinG: 14, carbG: 63, fatG: 7 },
  { id: "ml_18", dietPlanId: "dp_03", dayOfWeek: 1, slot: "PRANZO", recipeId: "r_prot_04", customLabel: null, grams: 200, kcal: 274, proteinG: 42, carbG: 0, fatG: 11 },
  { id: "ml_19", dietPlanId: "dp_03", dayOfWeek: 1, slot: "PRANZO", recipeId: "r_grain_02", customLabel: null, grams: 250, kcal: 395, proteinG: 15, carbG: 75, fatG: 2 },
  { id: "ml_20", dietPlanId: "dp_03", dayOfWeek: 1, slot: "CENA", recipeId: "r_prot_01", customLabel: null, grams: 200, kcal: 330, proteinG: 62, carbG: 0, fatG: 7 },
  { id: "ml_21", dietPlanId: "dp_03", dayOfWeek: 1, slot: "CENA", recipeId: "r_tub_02", customLabel: null, grams: 250, kcal: 215, proteinG: 4, carbG: 50, fatG: 0 },
  { id: "ml_22", dietPlanId: "dp_03", dayOfWeek: 1, slot: "CENA", recipeId: "r_veg_02", customLabel: null, grams: 150, kcal: 26, proteinG: 2, carbG: 5, fatG: 1 },
];

export const mockDietPlans = [
  {
    id: "dp_01",
    clientId: "c1a2b3c4d5e",
    weekStart: new Date("2026-07-06"),
    targetKcal: 2400,
    targetProteinG: 190,
    targetCarbG: 230,
    targetFatG: 67,
    status: "ACTIVE",
    generatedBy: "AI",
    approvedByTrainerAt: new Date("2026-07-06"),
    createdAt: new Date("2026-07-06"),
  },
  {
    id: "dp_02",
    clientId: "c2f3g4h5i6j",
    weekStart: new Date("2026-07-06"),
    targetKcal: 1950,
    targetProteinG: 110,
    targetCarbG: 210,
    targetFatG: 65,
    status: "ACTIVE",
    generatedBy: "AI",
    approvedByTrainerAt: new Date("2026-07-06"),
    createdAt: new Date("2026-07-05"),
  },
  {
    id: "dp_03",
    clientId: "c3k4l5m6n7o",
    weekStart: new Date("2026-07-06"),
    targetKcal: 2800,
    targetProteinG: 180,
    targetCarbG: 300,
    targetFatG: 85,
    status: "DRAFT",
    generatedBy: "AI",
    approvedByTrainerAt: null,
    createdAt: new Date("2026-07-04"),
  },
];

export const mockWorkoutPlans = [
  {
    id: "wp_01",
    clientId: "c1a2b3c4d5e",
    weekStart: new Date("2026-07-06"),
    status: "ACTIVE",
    generatedBy: "AI",
    approvedByTrainerAt: new Date("2026-07-06"),
    createdAt: new Date("2026-07-06"),
    sessions: [
      { id: "ws_01", workoutPlanId: "wp_01", dayOfWeek: 1, name: "Push" },
      { id: "ws_02", workoutPlanId: "wp_01", dayOfWeek: 3, name: "Pull" },
      { id: "ws_03", workoutPlanId: "wp_01", dayOfWeek: 5, name: "Legs" },
    ],
  },
  {
    id: "wp_02",
    clientId: "c2f3g4h5i6j",
    weekStart: new Date("2026-07-06"),
    status: "ACTIVE",
    generatedBy: "AI",
    approvedByTrainerAt: new Date("2026-07-05"),
    createdAt: new Date("2026-07-05"),
    sessions: [
      { id: "ws_04", workoutPlanId: "wp_02", dayOfWeek: 2, name: "Full Body A" },
      { id: "ws_05", workoutPlanId: "wp_02", dayOfWeek: 4, name: "Full Body B" },
    ],
  },
  {
    id: "wp_03",
    clientId: "c3k4l5m6n7o",
    weekStart: new Date("2026-07-06"),
    status: "DRAFT",
    generatedBy: "AI",
    approvedByTrainerAt: null,
    createdAt: new Date("2026-07-04"),
    sessions: [
      { id: "ws_06", workoutPlanId: "wp_03", dayOfWeek: 1, name: "Spinta" },
      { id: "ws_07", workoutPlanId: "wp_03", dayOfWeek: 3, name: "Trazione" },
      { id: "ws_08", workoutPlanId: "wp_03", dayOfWeek: 5, name: "Gambe" },
    ],
  },
];

export const mockSessionExercises = [
  // wp_01 — Push
  { id: "se_01", workoutSessionId: "ws_01", exerciseId: "ex_01", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10, targetRpe: 8, orderIndex: 0 },
  { id: "se_02", workoutSessionId: "ws_01", exerciseId: "ex_03", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7.5, orderIndex: 1 },
  { id: "se_03", workoutSessionId: "ws_01", exerciseId: "ex_11", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7.5, orderIndex: 2 },
  { id: "se_04", workoutSessionId: "ws_01", exerciseId: "ex_12", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, targetRpe: 7, orderIndex: 3 },
  { id: "se_05", workoutSessionId: "ws_01", exerciseId: "ex_14", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, targetRpe: 7, orderIndex: 4 },
  // wp_01 — Pull
  { id: "se_06", workoutSessionId: "ws_02", exerciseId: "ex_05", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10, targetRpe: 8, orderIndex: 0 },
  { id: "se_07", workoutSessionId: "ws_02", exerciseId: "ex_06", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, targetRpe: 8, orderIndex: 1 },
  { id: "se_08", workoutSessionId: "ws_02", exerciseId: "ex_07", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7.5, orderIndex: 2 },
  { id: "se_09", workoutSessionId: "ws_02", exerciseId: "ex_13", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7.5, orderIndex: 3 },
  // wp_01 — Legs
  { id: "se_10", workoutSessionId: "ws_03", exerciseId: "ex_08", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10, targetRpe: 8, orderIndex: 0 },
  { id: "se_11", workoutSessionId: "ws_03", exerciseId: "ex_09", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7.5, orderIndex: 1 },
  { id: "se_12", workoutSessionId: "ws_03", exerciseId: "ex_10", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7.5, orderIndex: 2 },
  { id: "se_13", workoutSessionId: "ws_03", exerciseId: "ex_15", targetSets: 3, targetRepsMin: 15, targetRepsMax: 20, targetRpe: 7, orderIndex: 3 },
  // wp_02 — Full Body A
  { id: "se_14", workoutSessionId: "ws_04", exerciseId: "ex_08", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7, orderIndex: 0 },
  { id: "se_15", workoutSessionId: "ws_04", exerciseId: "ex_05", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7, orderIndex: 1 },
  { id: "se_16", workoutSessionId: "ws_04", exerciseId: "ex_11", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7, orderIndex: 2 },
  { id: "se_17", workoutSessionId: "ws_04", exerciseId: "ex_15", targetSets: 3, targetRepsMin: 15, targetRepsMax: 20, targetRpe: 6.5, orderIndex: 3 },
  // wp_02 — Full Body B
  { id: "se_18", workoutSessionId: "ws_05", exerciseId: "ex_01", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7, orderIndex: 0 },
  { id: "se_19", workoutSessionId: "ws_05", exerciseId: "ex_06", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7, orderIndex: 1 },
  { id: "se_20", workoutSessionId: "ws_05", exerciseId: "ex_09", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7, orderIndex: 2 },
  // wp_03 — Spinta
  { id: "se_21", workoutSessionId: "ws_06", exerciseId: "ex_01", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8.5, orderIndex: 0 },
  { id: "se_22", workoutSessionId: "ws_06", exerciseId: "ex_11", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10, targetRpe: 8, orderIndex: 1 },
  { id: "se_23", workoutSessionId: "ws_06", exerciseId: "ex_14", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7.5, orderIndex: 2 },
  // wp_03 — Trazione
  { id: "se_24", workoutSessionId: "ws_07", exerciseId: "ex_05", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8.5, orderIndex: 0 },
  { id: "se_25", workoutSessionId: "ws_07", exerciseId: "ex_06", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10, targetRpe: 8, orderIndex: 1 },
  { id: "se_26", workoutSessionId: "ws_07", exerciseId: "ex_13", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, targetRpe: 7.5, orderIndex: 2 },
  // wp_03 — Gambe
  { id: "se_27", workoutSessionId: "ws_08", exerciseId: "ex_08", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, targetRpe: 8.5, orderIndex: 0 },
  { id: "se_28", workoutSessionId: "ws_08", exerciseId: "ex_09", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10, targetRpe: 8, orderIndex: 1 },
  { id: "se_29", workoutSessionId: "ws_08", exerciseId: "ex_15", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, targetRpe: 7.5, orderIndex: 2 },
];

// Helper functions for mock filtering/sorting (mirror Prisma query logic)
function applyWhere<T extends Record<string, unknown>>(items: T[], where?: Record<string, unknown>): T[] {
  if (!where) return items;
  return items.filter((item) => {
    for (const [key, val] of Object.entries(where)) {
      if (key === "OR" && Array.isArray(val)) {
        return val.some((cond: Record<string, unknown>) => applyWhere([item], cond).length > 0);
      }
      if (key === "AND" && Array.isArray(val)) {
        return val.every((cond: Record<string, unknown>) => applyWhere([item], cond).length > 0);
      }
      if (key === "NOT") {
        if (Array.isArray(val)) {
          return val.every((cond: Record<string, unknown>) => applyWhere([item], cond).length === 0);
        }
        if (typeof val === "object" && val !== null) {
          const notCond = val as Record<string, unknown>;
          for (const [nk, nv] of Object.entries(notCond)) {
            if (nk === "allergens" && Array.isArray(nv)) {
              const itemAllergens: string[] = JSON.parse(item.allergens as string || "[]");
              if (nv.some((a: string) => itemAllergens.includes(a))) return false;
            }
            if (nk === "dietTags" && typeof nv === "object" && "hasSome" in (nv as Record<string, unknown>)) {
              const itemDiets: string[] = JSON.parse(item.dietTags as string || "[]");
              if (itemDiets.some((d) => (nv as Record<string, string[]>).hasSome?.includes(d))) return false;
            }
          }
        }
        continue;
      }
      // Handle { field: { in: [...] } }
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        const cond = val as Record<string, unknown>;
        if ("in" in cond) {
          const inVals = cond.in as unknown[];
          if (!inVals.includes(item[key])) return false;
          continue;
        }
        if ("has" in cond) {
          const arr: string[] = JSON.parse(item[key] as string || "[]");
          if (!arr.includes(cond.has as string)) return false;
          continue;
        }
        if ("hasSome" in cond) {
          const arr: string[] = JSON.parse(item[key] as string || "[]");
          if (!arr.some((v) => (cond.hasSome as string[]).includes(v))) return false;
          continue;
        }
      }
      // Simple field equality (handles id, trainerId, clientId, sex, diet, status, goal, etc.)
      if (item[key] !== val) return false;
    }
    return true;
  });
}

function applyOrderBy<T extends Record<string, unknown>>(items: T[], orderBy?: Record<string, string> | Record<string, string>[]): T[] {
  if (!orderBy) return items;
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...items].sort((a, b) => {
    for (const o of orders) {
      const [key, dir] = Object.entries(o)[0];
      const va = a[key];
      const vb = b[key];
      if (va == null && vb == null) continue;
      if (va == null) return 1;
      if (vb == null) return -1;
      let cmp = 0;
      if (va instanceof Date && vb instanceof Date) {
        cmp = va.getTime() - vb.getTime();
      } else if (typeof va === "string" && typeof vb === "string") {
        cmp = va.localeCompare(vb);
      } else {
        cmp = Number(va) - Number(vb);
      }
      if (dir === "desc") cmp = -cmp;
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

function applyTake<T>(items: T[], take?: number): T[] {
  if (take == null) return items;
  return items.slice(0, take);
}

/**
 * Apply Prisma-style `select` to an item. Object-valued select keys (like `recipe: { select: { name: true } }`)
 * are treated as nested relation selects and resolved via applyIncludeItemSelect.
 */
function applySelectToItem(item: Record<string, unknown>, select: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(select)) {
    if (v === true) {
      filtered[k] = item[k];
    } else if (typeof v === "object" && v !== null) {
      const sub = v as Record<string, unknown>;
      if (sub.select) {
        const resolved = resolveRelationValue(k, sub, item);
        if (resolved !== null) filtered[k] = resolved;
      }
    }
  }
  return filtered;
}

/**
 * Resolve a relation value given the relation name, config, and the source item.
 * Uses the correct foreign key per relation type.
 */
function resolveRelationValue(relName: string, relConfig: unknown, sourceItem: Record<string, unknown>): unknown {
  // Determine the lookup key from the source item based on relation type
  const lookupId: string | undefined =
    relName === "client" ? sourceItem.clientId as string :
    relName === "recipe" ? sourceItem.recipeId as string :
    relName === "trainer" ? sourceItem.trainerId as string :
    relName === "exercise" ? sourceItem.exerciseId as string :
    sourceItem.id as string;

  const isObject = relConfig != null && typeof relConfig === "object";
  const select = isObject ? (relConfig as Record<string, unknown>).select as Record<string, unknown> | undefined : undefined;
  const include = isObject ? (relConfig as Record<string, unknown>).include as Record<string, unknown> | undefined : undefined;
  const orderBy = isObject ? (relConfig as Record<string, unknown>).orderBy as Record<string, string> | undefined : undefined;
  const take = isObject ? (relConfig as Record<string, unknown>).take as number | undefined : undefined;

  switch (relName) {
    case "checkIns": {
      let items = mockCheckIns.filter((c) => c.clientId === lookupId) as unknown as Record<string, unknown>[];
      if (orderBy) items = applyOrderBy(items, orderBy);
      if (take != null) items = applyTake(items, take);
      return items;
    }
    case "dietPlans": {
      let items = mockDietPlans.filter((dp) => dp.clientId === lookupId) as unknown as Record<string, unknown>[];
      if (orderBy) items = applyOrderBy(items, orderBy);
      if (take != null) items = applyTake(items, take);
      if (include) items = items.map((item) => applyInclude(item, include));
      return items;
    }
    case "meals": {
      let items = mockMeals.filter((m) => m.dietPlanId === lookupId) as unknown as Record<string, unknown>[];
      if (select) {
        items = items.map((m) => applySelectToItem(m, select));
        return items;
      }
      if (include) items = items.map((item) => applyInclude(item, include));
      return items;
    }
    case "sessions": {
      const plan = mockWorkoutPlans.find((p) => p.id === sourceItem.id) as Record<string, unknown> | undefined;
      let sessions = (plan?.sessions as Record<string, unknown>[] | undefined) ?? [];
      if (orderBy) sessions = applyOrderBy(sessions, orderBy);
      if (include) sessions = sessions.map((s) => applyInclude(s, include));
      return sessions;
    }
    case "exercises": {
      let items = mockSessionExercises.filter((se) => se.workoutSessionId === lookupId) as unknown as Record<string, unknown>[];
      if (orderBy) items = applyOrderBy(items, orderBy);
      if (include) items = items.map((item) => applyInclude(item, include));
      return items;
    }
    case "exercise": {
      const se = mockSessionExercises.find((s) => s.id === lookupId);
      if (!se) return null;
      const ex = mockExercises.find((e) => e.id === se.exerciseId);
      if (!ex) return null;
      if (select) return applySelectToItem(ex as unknown as Record<string, unknown>, select);
      return ex;
    }
    case "logs": {
      return [];
    }
    case "client": {
      const cl = mockClients.find((c) => c.id === lookupId);
      if (!cl) return null;
      if (select) return applySelectToItem(cl as unknown as Record<string, unknown>, select);
      return cl;
    }
    case "recipe": {
      const r = mockRecipes.find((rec) => rec.id === lookupId);
      if (!r) return null;
      if (select) return applySelectToItem(r as unknown as Record<string, unknown>, select);
      return r;
    }
    case "trainer": {
      const tr = mockTrainer;
      if (!tr) return null;
      if (select) return applySelectToItem(tr as unknown as Record<string, unknown>, select);
      return tr;
    }
    case "_count": {
      const counts: Record<string, number> = {};
      if (isObject) {
        const sel = (relConfig as Record<string, unknown>).select as Record<string, boolean> | undefined;
        if (sel) {
          for (const [key] of Object.entries(sel)) {
            if (key === "checkIns") counts[key] = mockCheckIns.filter((c) => c.clientId === lookupId).length;
            else if (key === "dietPlans") counts[key] = mockDietPlans.filter((dp) => dp.clientId === lookupId).length;
            else if (key === "workoutPlans") counts[key] = mockWorkoutPlans.filter((wp) => wp.clientId === lookupId).length;
            else if (key === "clients") counts[key] = mockClients.filter((c) => c.trainerId === lookupId).length;
            else if (key === "recipes") counts[key] = mockRecipes.filter((r) => r.trainerId === lookupId || r.trainerId === null).length;
            else if (key === "exercises") counts[key] = mockExercises.filter((e) => e.trainerId === lookupId || e.trainerId === null).length;
          }
        }
      }
      return counts;
    }
    default:
      return null;
  }
}

// Handles `include` expansions for Prisma relation includes
function applyInclude<T extends Record<string, unknown>>(item: T, include?: Record<string, unknown>): T {
  if (!include) return item;
  const result = { ...item };
  for (const [rel, config] of Object.entries(include)) {
    if (!config) continue;
    const resolved = resolveRelationValue(rel, config, result as Record<string, unknown>);
    if (resolved !== null) {
      (result as Record<string, unknown>)[rel] = resolved;
    }
  }
  return result;
}

// Mock data store
const DATA_STORE: Record<string, Record<string, unknown>[]> = {
  trainer: [mockTrainer],
  client: mockClients as unknown as Record<string, unknown>[],
  checkIn: mockCheckIns as unknown as Record<string, unknown>[],
  recipe: mockRecipes as unknown as Record<string, unknown>[],
  exercise: mockExercises as unknown as Record<string, unknown>[],
  dietPlan: mockDietPlans as unknown as Record<string, unknown>[],
  dietPlanMeal: mockMeals as unknown as Record<string, unknown>[],
  workoutPlan: mockWorkoutPlans as unknown as Record<string, unknown>[],
  workoutSession: [] as Record<string, unknown>[],
  workoutSessionExercise: mockSessionExercises as unknown as Record<string, unknown>[],
  sessionLog: [] as Record<string, unknown>[],
};

/**
 * Preprocess where clauses to handle nested relation filters like
 * `where: { client: { trainerId } }` by resolving the related IDs first.
 */
function preprocessWhere(where: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!where) return where;
  const processed: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(where)) {
    if (key === "client" && typeof val === "object" && val !== null) {
      const cond = val as Record<string, unknown>;
      if (cond.trainerId) {
        const clientIds = mockClients.filter((c) => c.trainerId === cond.trainerId).map((c) => c.id);
        processed.clientId = { in: clientIds };
        continue;
      }
    }
    processed[key] = val;
  }
  return processed;
}

function buildMockDelegate<T extends Record<string, unknown>>(data: T[]) {
  return {
    findMany: ({ where, orderBy, take, include }: { where?: Record<string, unknown>; orderBy?: Record<string, string> | Record<string, string>[]; take?: number; include?: Record<string, unknown> } = {}) => {
      let result = applyWhere(data, preprocessWhere(where));
      result = applyOrderBy(result, orderBy);
      result = applyTake(result, take);
      if (include) {
        return Promise.resolve(result.map((item) => applyInclude(item, include)));
      }
      return Promise.resolve(result);
    },
    findUnique: ({ where, include }: { where: Record<string, unknown>; include?: Record<string, unknown> }) => {
      const found = data.find((item) => {
        for (const [key, val] of Object.entries(where)) {
          if (item[key] !== val) return false;
        }
        return true;
      }) ?? null;
      if (found && include) {
        return Promise.resolve(applyInclude(found, include));
      }
      return Promise.resolve(found);
    },
    findFirst: ({ where }: { where: Record<string, unknown> }) => {
      const result = applyWhere(data, where);
      return Promise.resolve(result[0] ?? null);
    },
    count: ({ where }: { where?: Record<string, unknown> } = {}) => {
      return Promise.resolve(applyWhere(data, where).length);
    },
    create: ({ data: inputData }: { data: Record<string, unknown> }) => {
      const newItem = { id: `mock_${Date.now()}`, ...inputData } as unknown as T;
      (data as Record<string, unknown>[]).push(newItem as unknown as Record<string, unknown>);
      return Promise.resolve(newItem);
    },
    update: ({ where, data: updateData }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      const idx = data.findIndex((item) => {
        for (const [key, val] of Object.entries(where)) {
          if (item[key] !== val) return false;
        }
        return true;
      });
      if (idx === -1) return Promise.resolve(null);
      const raw = data as unknown as Record<string, unknown>[];
      raw[idx] = { ...raw[idx], ...updateData };
      return Promise.resolve(raw[idx] as unknown as T);
    },
    delete: ({ where }: { where: Record<string, unknown> }) => {
      const raw = data as unknown as Record<string, unknown>[];
      const idx = raw.findIndex((item) => {
        for (const [key, val] of Object.entries(where)) {
          if (item[key] !== val) return false;
        }
        return true;
      });
      if (idx === -1) return Promise.resolve(null);
      const deleted = raw.splice(idx, 1)[0];
      return Promise.resolve(deleted);
    },
  };
}

export function createMockPrisma() {
  return new Proxy({} as Record<string, unknown>, {
    get(_target, modelName: string) {
      if (modelName === "then" || modelName === "catch" || modelName === "finally") return undefined;
      if (modelName === "$connect" || modelName === "$disconnect") {
        return () => Promise.resolve();
      }
      if (modelName === "$transaction") {
        return (fn: (prisma: unknown) => unknown) => {
          const mock = createMockPrisma();
          return Promise.resolve(fn(mock));
        };
      }
      const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
      const data = DATA_STORE[modelKey];
      if (data) {
        return buildMockDelegate(data);
      }
      return buildMockDelegate([]);
    },
  });
}
