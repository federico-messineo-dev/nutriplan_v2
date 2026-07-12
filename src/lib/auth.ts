/**
 * lib/auth.ts
 * Phase 0: hardcoded trainer ID from env.
 * Phase 3+: swap to Supabase Auth session.
 */

export function getTrainerId(): string {
  const id = process.env.TRAINER_ID;
  if (!id) throw new Error("TRAINER_ID not set in environment variables.");
  return id;
}
