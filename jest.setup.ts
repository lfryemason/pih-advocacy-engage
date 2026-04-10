import "@testing-library/jest-dom";
import { server } from "./__tests__/mocks/supabase";

// Point the Supabase client at localhost so MSW can intercept
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
});
