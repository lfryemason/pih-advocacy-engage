import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./__tests__/mocks/supabase";

// Point the Supabase client at localhost so MSW can intercept
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
