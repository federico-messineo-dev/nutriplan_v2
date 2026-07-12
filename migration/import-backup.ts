/**
 * migration/import-backup.ts
 * One-time import script: reads nutriplan_backup_*.json (v4 format)
 * and maps it into the new Prisma/Postgres schema.
 *
 * Run: npm run migrate:import
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

const TRAINER_ID = "trainer_001";

// --- Types matching the legacy export shape ---
interface LegacyMeasurement {
  id: string;
  date: string;
  weight?: number | null;
  waist?: number | null;
  hips?: number | null;
  chest?: number | null;
  arm?: number | null;
  thigh?: number | null;
  calf?: number | null;
  notes?: string;
}

interface LegacyNote {
  id: string;
  date: string;
  text: string;
}

interface LegacyClient {
  id: string;
  name: string;
  createdAt: string;
  profile: {
    sex?: string;
    age?: number | null;
    height?: number | null;
    startWeight?: number | null;
    activity?: number;
    activityCustom?: boolean;
    goal?: string;
    kcalAdjust?: number | null;
    bmrManual?: number | null;
    tdeeManual?: number | null;
    diet?: string;
    exclusions?: string[];
    waterL?: number;
    trainingDays?: number;
  };
  calc?: Record<string, unknown> | null;
  targets?: { kcal?: number; p?: number; c?: number; f?: number } | null;
  plan?: Record<string, unknown> | null;
  measurements?: LegacyMeasurement[];
  photos?: unknown[];
  notes?: LegacyNote[];
}

interface LegacyBackup {
  clients: LegacyClient[];
  activeClientId?: string;
  exportedAt?: string;
  version?: string;
}

// --- Mapping helpers ---

function mapGoal(goal?: string): string {
  const map: Record<string, string> = {
    cut: "CUT",
    maintain: "MAINTAIN",
    bulk: "BULK",
    recomp: "RECOMP",
  };
  return map[goal || "maintain"] || "MAINTAIN";
}

function mapDiet(diet?: string): string {
  const map: Record<string, string> = {
    onnivoro: "ONNIVORO",
    pescetariano: "PESCETARIANO",
    vegetariano: "VEGETARIANO",
    vegano: "VEGANO",
  };
  return map[diet || "onnivoro"] || "ONNIVORO";
}

function mapSex(sex?: string): string | null {
  if (sex === "M" || sex === "F") return sex;
  return null;
}

function generatePhoneId(): string {
  // Generate a unique fake phone number for clients that don't have one
  return `+39${Math.floor(3000000000 + Math.random() * 7000000000)}`;
}

async function importClient(client: LegacyClient) {
  console.log(`  Importing: ${client.name} (${client.id})`);

  // 1. Create or update the client
  const newClient = await prisma.client.upsert({
    where: { id: client.id },
    update: {},
    create: {
      id: client.id,
      trainerId: TRAINER_ID,
      fullName: client.name,
      phoneNumberE164: generatePhoneId(),
      status: "ACTIVE",
      sex: mapSex(client.profile?.sex),
      age: client.profile?.age ?? null,
      heightCm: client.profile?.height ?? null,
      startWeightKg: client.profile?.startWeight ?? null,
      exclusions: JSON.stringify(client.profile?.exclusions || []),
      diet: mapDiet(client.profile?.diet),
      activityFactor: client.profile?.activity || 1.55,
      goal: mapGoal(client.profile?.goal),
      trainingDaysWk: client.profile?.trainingDays || 3,
      waterTargetL: client.profile?.waterL || 2,
      bmrManualKcal: client.profile?.bmrManual ?? null,
      tdeeManualKcal: client.profile?.tdeeManual ?? null,
    },
  });

  // 2. Import measurements as CheckIns
  if (client.measurements && client.measurements.length > 0) {
    for (const m of client.measurements) {
      await prisma.checkIn.create({
        data: {
          id: m.id,
          clientId: newClient.id,
          weightKg: m.weight ?? null,
          notes: m.notes || undefined,
          source: "MANUAL",
          createdAt: new Date(m.date),
        },
      });
    }
    console.log(`    -> ${client.measurements.length} measurements imported`);
  }

  // 3. Import notes (as CheckIns with notes field)
  if (client.notes && client.notes.length > 0) {
    for (const n of client.notes) {
      await prisma.checkIn.create({
        data: {
          clientId: newClient.id,
          notes: n.text,
          source: "MANUAL",
          createdAt: new Date(n.date),
        },
      });
    }
    console.log(`    -> ${client.notes.length} notes imported`);
  }

  // 4. Import plan (store as JSON in a CheckIn note for now — DietPlan model is for structured plans)
  if (client.plan) {
    await prisma.checkIn.create({
      data: {
        clientId: newClient.id,
        notes: `[LEGACY_PLAN_IMPORT] ${JSON.stringify(client.plan)}`,
        source: "MANUAL",
        createdAt: new Date(client.createdAt),
      },
    });
    console.log(`    -> Legacy plan stored as reference note`);
  }

  return newClient;
}

async function main() {
  const backupPath = join(__dirname, "nutriplan_backup.json");
  console.log(`Reading backup from: ${backupPath}`);

  const raw = readFileSync(backupPath, "utf-8");
  const backup: LegacyBackup = JSON.parse(raw);

  if (!backup.clients || !Array.isArray(backup.clients)) {
    throw new Error("Invalid backup format: missing 'clients' array");
  }

  console.log(`Found ${backup.clients.length} clients in backup (version: ${backup.version})`);

  // Ensure trainer exists
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

  // Import each client
  for (const client of backup.clients) {
    await importClient(client);
  }

  console.log("\nImport complete.");
  console.log(`Total clients: ${await prisma.client.count()}`);
  console.log(`Total check-ins: ${await prisma.checkIn.count()}`);
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
