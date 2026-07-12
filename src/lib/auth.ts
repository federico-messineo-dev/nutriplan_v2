/**
 * lib/auth.ts
 * Phase 0: hardcoded trainer ID from env.
 * Phase 3+: swap to Supabase Auth session.
 */

export function getTrainerId(): string {
  const id = process.env.TRAINER_ID;
  if (id) return id;
  // In mock mode (Vercel without Postgres), return the mock trainer ID
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL?.startsWith("postgres")) {
    return "trainer_001";
  }
  throw new Error("TRAINER_ID not set in environment variables.");
}
