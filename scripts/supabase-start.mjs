import { execSync } from "child_process";

// Remove the vector container if it is lingering from a previous session.
// This happens on Windows when Docker isn't shut down cleanly — the container
// name stays reserved even though it's stopped, and `supabase start` refuses
// to create a new one with the same name. Removing the container is safe: it
// does NOT touch the Docker volume, so all database data is preserved.
try {
  execSync("docker rm -f supabase_vector_pih-advocacy-engage", {
    stdio: "pipe",
  });
  console.log("Removed stale supabase_vector container.");
} catch {
  // Container wasn't there — nothing to do.
}

execSync("supabase start", { stdio: "inherit" });
