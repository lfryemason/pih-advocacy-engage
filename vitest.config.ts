import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Pin timezone so snapshots containing TZ_DISPLAY_NAME are deterministic on all CI machines.
process.env.TZ = "UTC";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.ts?(x)"],
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
