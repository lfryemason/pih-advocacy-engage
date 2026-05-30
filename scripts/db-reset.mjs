/**
 * Cross-platform replacement for the bash-only db:reset npm script.
 * Runs `supabase db reset`, reads the local credentials via
 * `supabase status -o env`, then seeds representatives — without relying
 * on `eval`, `sed`, or any POSIX shell syntax.
 *
 * Use this when you need to wipe the database and start fresh (e.g. after
 * adding new migrations). Do NOT run this just to restart Supabase — use
 * `npm run supabase:start` instead, which preserves all data.
 */
import { execSync, spawnSync } from "child_process";

// 1. Wipe and re-apply all migrations.
execSync("supabase db reset", { stdio: "inherit" });

// 2. Read the local Supabase credentials from `supabase status -o env`.
//    Output format: KEY="value" (one per line, may include warning lines).
let statusOutput;
try {
  statusOutput = execSync("supabase status -o env", { encoding: "utf8" });
} catch (err) {
  // stderr warnings can cause a non-zero exit code; grab stdout anyway.
  statusOutput = err.stdout ?? "";
}

const env = { ...process.env };
for (const line of statusOutput.split("\n")) {
  const match = line.match(/^(\w+)="(.+)"$/);
  if (match) env[match[1]] = match[2];
}

// 3. Seed representatives (uses API_URL + SERVICE_ROLE_KEY from env above).
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", "scripts/seed-representatives.ts"],
  { stdio: "inherit", env },
);

process.exit(result.status ?? 0);
