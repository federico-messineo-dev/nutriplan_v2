/**
 * prisma/seed.ts
 * Seeds the database with 1 trainer + 3 mock clients.
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TRAINER_ID = "trainer_001";

async function main() {
  console.log("Seeding database...");

  // Create trainer
  await prisma.trainer.upsert({
    where: { id: TRAINER_ID },
    update: {},
    create: {
      id: TRAINER_ID,
      email: "trainer@nutriplan.local",
      fullName: "Alberto Iocca",
      businessName: "NutriPlan Pro",
    },
  });
  console.log("  Trainer created: Alberto Iocca");

  // --- Client 1: Marco Bianchi (cut) ---
  const marco = await prisma.client.upsert({
    where: { id: "c1a2b3c4d5e" },
    update: {},
    create: {
      id: "c1a2b3c4d5e",
      trainerId: TRAINER_ID,
      fullName: "Marco Bianchi",
      phoneNumberE164: "+393331234567",
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
    },
  });
  console.log("  Client created: Marco Bianchi (cut)");

  // Marco's measurements
  const marcoMeasurements = [
    { id: "m1a2b3c4d1", date: "2025-09-15", weight: 96.5, waist: 98, hips: 102, chest: 104, arm: 36, thigh: 62, calf: 40, notes: "Peso iniziale" },
    { id: "m1a2b3c4d2", date: "2025-10-15", weight: 94.2, waist: 96, hips: 101, chest: 103, arm: 35.5, thigh: 61, calf: 39.5, notes: "" },
    { id: "m1a2b3c4d3", date: "2025-11-15", weight: 92.8, waist: 94, hips: 100, chest: 103, arm: 35, thigh: 60, calf: 39, notes: "Buon trend" },
    { id: "m1a2b3c4d4", date: "2025-12-15", weight: 91.1, waist: 92, hips: 99, chest: 102, arm: 35, thigh: 59, calf: 39, notes: "" },
    { id: "m1a2b3c4d5", date: "2026-01-15", weight: 89.4, waist: 90, hips: 98, chest: 102, arm: 34.5, thigh: 58.5, calf: 38.5, notes: "Ottimo lavoro, 7 kg persi" },
    { id: "m1a2b3c4d6", date: "2026-02-15", weight: 88.2, waist: 89, hips: 97, chest: 101, arm: 34.5, thigh: 58, calf: 38.5, notes: "" },
    { id: "m1a2b3c4d7", date: "2026-03-15", weight: 87.0, waist: 88, hips: 97, chest: 101, arm: 34, thigh: 57.5, calf: 38, notes: "Rallentamento" },
    { id: "m1a2b3c4d8", date: "2026-04-15", weight: 86.1, waist: 87, hips: 96, chest: 100, arm: 34, thigh: 57, calf: 38, notes: "" },
    { id: "m1a2b3c4d9", date: "2026-05-15", weight: 85.3, waist: 86, hips: 96, chest: 100, arm: 34, thigh: 57, calf: 38, notes: "Tornato a calare" },
    { id: "m1a2b3c4d10", date: "2026-06-15", weight: 84.5, waist: 85, hips: 95, chest: 100, arm: 33.5, thigh: 56.5, calf: 37.5, notes: "" },
    { id: "m1a2b3c4d11", date: "2026-07-01", weight: 84.0, waist: 85, hips: 95, chest: 99, arm: 33.5, thigh: 56.5, calf: 37.5, notes: "Ultima before summer" },
  ];

  // Store measurements as checkIns
  for (const m of marcoMeasurements) {
    await prisma.checkIn.create({
      data: {
        id: m.id,
        clientId: marco.id,
        weightKg: m.weight,
        notes: m.notes || undefined,
        source: "MANUAL",
        createdAt: new Date(m.date),
      },
    });
  }
  console.log("  Check-ins created for Marco: 11 measurements");

  // Marco's notes
  await prisma.checkIn.create({
    data: {
      clientId: marco.id,
      notes: "Cliente motivato, vuole perdere 10-12 kg. Allergia lattosio. Allena 4x/week push/pull/legs/upper.",
      source: "MANUAL",
      createdAt: new Date("2025-09-15"),
    },
  });

  // --- Client 2: Giulia Verdi (maintain, vegetarian) ---
  const giulia = await prisma.client.upsert({
    where: { id: "c2f3g4h5i6j" },
    update: {},
    create: {
      id: "c2f3g4h5i6j",
      trainerId: TRAINER_ID,
      fullName: "Giulia Verdi",
      phoneNumberE164: "+393337654321",
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
    },
  });
  console.log("  Client created: Giulia Verdi (maintain, vegetariano)");

  const giuliaMeasurements = [
    { id: "m2a2b3c4d1", date: "2025-11-02", weight: 62.0 },
    { id: "m2a2b3c4d2", date: "2025-12-02", weight: 61.8 },
    { id: "m2a2b3c4d3", date: "2026-01-10", weight: 61.5 },
    { id: "m2a2b3c4d4", date: "2026-02-10", weight: 61.3 },
    { id: "m2a2b3c4d5", date: "2026-03-10", weight: 61.0 },
    { id: "m2a2b3c4d6", date: "2026-04-14", weight: 61.2 },
    { id: "m2a2b3c4d7", date: "2026-05-12", weight: 61.0 },
    { id: "m2a2b3c4d8", date: "2026-06-15", weight: 60.8 },
  ];

  for (const m of giuliaMeasurements) {
    await prisma.checkIn.create({
      data: {
        id: m.id,
        clientId: giulia.id,
        weightKg: m.weight,
        source: "MANUAL",
        createdAt: new Date(m.date),
      },
    });
  }
  console.log("  Check-ins created for Giulia: 8 measurements");

  // --- Client 3: Luca Russo (bulk) ---
  const luca = await prisma.client.upsert({
    where: { id: "c3k4l5m6n7o" },
    update: {},
    create: {
      id: "c3k4l5m6n7o",
      trainerId: TRAINER_ID,
      fullName: "Luca Russo",
      phoneNumberE164: "+393339876543",
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
    },
  });
  console.log("  Client created: Luca Russo (bulk, BMR manual)");

  const lucaMeasurements = [
    { id: "m3a2b3c4d1", date: "2026-01-20", weight: 88.0 },
    { id: "m3a2b3c4d2", date: "2026-02-17", weight: 88.8 },
    { id: "m3a2b3c4d3", date: "2026-03-17", weight: 89.6 },
    { id: "m3a2b3c4d4", date: "2026-04-14", weight: 90.2 },
    { id: "m3a2b3c4d5", date: "2026-05-12", weight: 91.0 },
    { id: "m3a2b3c4d6", date: "2026-06-16", weight: 91.8 },
  ];

  for (const m of lucaMeasurements) {
    await prisma.checkIn.create({
      data: {
        id: m.id,
        clientId: luca.id,
        weightKg: m.weight,
        source: "MANUAL",
        createdAt: new Date(m.date),
      },
    });
  }
  console.log("  Check-ins created for Luca: 6 measurements");

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
