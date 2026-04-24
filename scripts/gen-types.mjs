#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const OUTPUT_PATH = "lib/supabase/database.types.ts";

// Nullability overrides the Supabase generator gets wrong. Each entry
// documents *why* the generator's output is incorrect.
const OVERRIDES = [
  {
    // super_admin rows have org_id = null, and a missing user_role row also
    // yields null — but Postgres doesn't advertise function nullability, so
    // the generator emits `Returns: string`.
    find: /current_org_id: \{ Args: never; Returns: string \}/,
    replace: "current_org_id: { Args: never; Returns: string | null }",
  },
];

let output = execFileSync(
  "supabase",
  ["gen", "types", "typescript", "--local"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
);

for (const { find, replace } of OVERRIDES) {
  if (!find.test(output)) {
    console.error(
      `Override pattern not matched — Supabase output format may have changed: ${find}`,
    );
    process.exit(1);
  }
  output = output.replace(find, replace);
}

writeFileSync(OUTPUT_PATH, output);
console.log(
  `Wrote ${OUTPUT_PATH} with ${OVERRIDES.length} override(s) applied`,
);
