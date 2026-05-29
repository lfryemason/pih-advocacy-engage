import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const SUPABASE_URL = "http://localhost";
const REST_PATH = `${SUPABASE_URL}/rest/v1/representatives`;
const USER_ROLE_REST_PATH = `${SUPABASE_URL}/rest/v1/user_role`;

export interface MockRepresentative {
  id: string;
  bioguide_id: string;
  first_name: string;
  last_name: string;
  official_full_name: string | null;
  chamber: string;
  state: string;
  district: number | null;
  party: string;
  state_rank: string | null;
  birthday: string | null;
  in_office: boolean;
  pronouns: string | null;
  email: string | null;
  general_links: unknown[];
  created_at: string;
  updated_at: string;
}

export interface MockUserRole {
  user_id: string;
  role: "member" | "org_admin" | "super_admin";
  org_id: string | null;
}

export function makeRepresentative(
  overrides: Partial<MockRepresentative> = {},
): MockRepresentative {
  return {
    id: "uuid-1",
    bioguide_id: "S000001",
    first_name: "Jane",
    last_name: "Doe",
    official_full_name: "Jane Doe",
    chamber: "sen",
    state: "MA",
    district: null,
    party: "Democrat",
    state_rank: "senior",
    birthday: "1960-01-01",
    in_office: true,
    pronouns: null,
    email: null,
    general_links: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeUserRole(
  overrides: Partial<MockUserRole> = {},
): MockUserRole {
  return {
    user_id: "user-1",
    role: "member",
    org_id: "pihe",
    ...overrides,
  };
}

export interface MockStaffer {
  id: string;
  representative_id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  pronouns: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function makeStaffer(overrides: Partial<MockStaffer> = {}): MockStaffer {
  return {
    id: "staffer-uuid-1",
    representative_id: "uuid-1",
    org_id: "pihe",
    first_name: "Sam",
    last_name: "Jones",
    title: "Chief of Staff",
    pronouns: "they/them",
    email: "sam@example.com",
    phone: null,
    location: null,
    linkedin_url: null,
    notes: "Primary contact for healthcare policy.",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function applyFilters<T>(data: T[], url: URL): T[] {
  let filtered = [...data];
  for (const [key, value] of url.searchParams) {
    if (value.startsWith("eq.")) {
      const eqVal = value.slice(3);
      filtered = filtered.filter(
        (r) => String((r as Record<string, unknown>)[key]) === eqVal,
      );
    }
  }
  return filtered;
}

/**
 * Creates MSW handlers that mock the Supabase PostgREST
 * `/rest/v1/representatives` endpoint.
 *
 * Supports:
 * - HEAD requests (count queries with Prefer: count=exact)
 * - GET list queries with offset/limit pagination
 * - GET single-row queries (Accept: vnd.pgrst.object)
 */
export function representativesHandlers(
  data: MockRepresentative[],
  error?: string,
) {
  const errorResponse = () =>
    HttpResponse.json({ message: error }, { status: 400 });

  return [
    // HEAD — Supabase count query (select with head: true)
    http.head(REST_PATH, ({ request }) => {
      if (error) return errorResponse();

      const url = new URL(request.url);
      const filtered = applyFilters(data, url);

      return new HttpResponse(null, {
        status: 200,
        headers: {
          "content-range": `0-0/${filtered.length}`,
        },
      });
    }),

    // GET — list and single-row queries
    http.get(REST_PATH, ({ request }) => {
      if (error) return errorResponse();

      const url = new URL(request.url);
      const filtered = applyFilters(data, url);
      const accept = request.headers.get("accept") ?? "";

      // Single-row query (.single())
      if (accept.includes("vnd.pgrst.object")) {
        const item = filtered[0] ?? null;
        if (!item) {
          return HttpResponse.json({ message: "not found" }, { status: 406 });
        }
        return HttpResponse.json(item);
      }

      // List query with offset/limit pagination
      const offset = parseInt(url.searchParams.get("offset") ?? "0");
      const limit = parseInt(
        url.searchParams.get("limit") ?? String(filtered.length),
      );
      const sliced = filtered.slice(offset, offset + limit);
      const prefer = request.headers.get("prefer") ?? "";

      return HttpResponse.json(sliced, {
        headers: prefer.includes("count=exact")
          ? {
              "content-range": `${offset}-${offset + sliced.length - 1}/${filtered.length}`,
            }
          : {},
      });
    }),
  ];
}

export function userRoleHandlers(data: MockUserRole[]) {
  return [
    http.get(USER_ROLE_REST_PATH, ({ request }) => {
      const url = new URL(request.url);
      const filtered = applyFilters(data, url);
      const accept = request.headers.get("accept") ?? "";
      if (accept.includes("vnd.pgrst.object")) {
        const item = filtered[0] ?? null;
        if (!item) {
          return HttpResponse.json({ message: "not found" }, { status: 406 });
        }
        return HttpResponse.json(item);
      }
      return HttpResponse.json(filtered);
    }),
  ];
}

export const server = setupServer();
