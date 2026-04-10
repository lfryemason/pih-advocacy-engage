import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jest-fixed-jsdom",
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

// next/jest sets its own transformIgnorePatterns that block ESM
// packages. We override the resolved config to also allow msw and
// its transitive deps through the transformer.
export default async function jestConfig() {
  const nextConfig = await createJestConfig(config)();
  return {
    ...nextConfig,
    transformIgnorePatterns: [
      "/node_modules/(?!(msw|rettime|until-async|@bundled-es-modules|@mswjs)/)",
      "^.+\\.module\\.(css|sass|scss)$",
    ],
  };
}
