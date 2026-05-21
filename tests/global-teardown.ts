import { seedRepresentatives } from "../scripts/seed-representatives";

export default async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;

  if (!key) return;

  console.log("\nRe-seeding congress members...");
  await seedRepresentatives(url, key);
}
