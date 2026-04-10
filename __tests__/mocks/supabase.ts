import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const SUPABASE_URL = "http://localhost";
const REST_PATH = `${SUPABASE_URL}/rest/v1/representatives`;

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
  general_links: unknown[];
  org_links: Record<string, unknown[]>;
  created_at: string;
  updated_at: string;
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
    general_links: [],
    org_links: { pihe: [] },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function applyFilters(
  data: MockRepresentative[],
  url: URL,
): MockRepresentative[] {
  let filtered = [...data];
  for (const [key, value] of url.searchParams) {
    if (value.startsWith("eq.")) {
      const eqVal = value.slice(3);
      filtered = filtered.filter(
        (r) =>
          String(r[key as keyof MockRepresentative]) === eqVal,
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
          return HttpResponse.json(
            { message: "not found" },
            { status: 406 },
          );
        }
        return HttpResponse.json(item);
      }

      // List query with offset/limit pagination
      const offset = parseInt(
        url.searchParams.get("offset") ?? "0",
      );
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

export const server = setupServer();
