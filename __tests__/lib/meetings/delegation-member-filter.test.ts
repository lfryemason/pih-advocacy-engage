import { describe, it, expect } from "vitest";
import {
  fetchMeetings,
  fetchDelegationMemberOptions,
} from "@/lib/meetings/queries";
import { EMPTY_MEETING_FILTERS } from "@/components/meetings/meetings-filters";

type Call = { method: string; args: unknown[] };

/**
 * Records the PostgREST builder chain instead of hitting a server, so tests can
 * assert on the shape of the request fetchMeetings builds.
 */
function recordingClient(rows: unknown[] = []) {
  const calls: Call[] = [];
  const result = { data: rows, error: null, count: rows.length };

  const builder: Record<string, unknown> = {};
  const proxy: unknown = new Proxy(builder, {
    get(_target, prop) {
      if (prop === "then") {
        return (resolve: (value: typeof result) => unknown) =>
          Promise.resolve(result).then(resolve);
      }
      return (...args: unknown[]) => {
        calls.push({ method: String(prop), args });
        return proxy;
      };
    },
  });

  const supabase = {
    from: (table: string) => {
      calls.push({ method: "from", args: [table] });
      return proxy;
    },
  } as unknown as Parameters<typeof fetchMeetings>[0];

  const find = (method: string) => calls.filter((c) => c.method === method);
  return { supabase, calls, find };
}

const BASE = {
  section: "upcoming" as const,
  offset: 0,
  limit: 15,
};

describe("fetchMeetings — delegation member filter", () => {
  it("does not join the delegation table when no member is selected", async () => {
    const { supabase, find } = recordingClient();

    await fetchMeetings(supabase, { ...BASE, filters: EMPTY_MEETING_FILTERS });

    expect(find("select")[0].args[0]).not.toContain("delegation_filter");
    expect(
      find("in").some((c) => c.args[0] === "delegation_filter.user_id"),
    ).toBe(false);
  });

  it("inner-joins an aliased delegation embed and filters it by user", async () => {
    const { supabase, find } = recordingClient();

    await fetchMeetings(supabase, {
      ...BASE,
      filters: { ...EMPTY_MEETING_FILTERS, delegationUserIds: ["user-1"] },
    });

    expect(find("select")[0].args[0]).toContain(
      "delegation_filter:meeting_delegation_members!inner",
    );
    expect(find("in")).toContainEqual({
      method: "in",
      args: ["delegation_filter.user_id", ["user-1"]],
    });
  });

  it("matches meetings delegating to any of several selected users", async () => {
    const { supabase, find } = recordingClient();

    await fetchMeetings(supabase, {
      ...BASE,
      filters: {
        ...EMPTY_MEETING_FILTERS,
        delegationUserIds: ["user-1", "user-2"],
      },
    });

    expect(find("in")).toContainEqual({
      method: "in",
      args: ["delegation_filter.user_id", ["user-1", "user-2"]],
    });
  });

  it("keeps the unaliased delegation embed so every delegate is still returned", async () => {
    const { supabase, find } = recordingClient();

    await fetchMeetings(supabase, {
      ...BASE,
      filters: { ...EMPTY_MEETING_FILTERS, delegationUserIds: ["user-1"] },
    });

    expect(find("select")[0].args[0]).toContain(
      "meeting_delegation_members ( user_id, role, profiles ( first_name, last_name ) )",
    );
  });
});

describe("fetchDelegationMemberOptions", () => {
  function optionsClient(rows: unknown[]) {
    const calls: Call[] = [];
    const result = { data: rows, error: null };

    const proxy: unknown = new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then") {
            return (resolve: (value: typeof result) => unknown) =>
              Promise.resolve(result).then(resolve);
          }
          return (...args: unknown[]) => {
            calls.push({ method: String(prop), args });
            return proxy;
          };
        },
      },
    );

    const supabase = {
      from: () => proxy,
    } as unknown as Parameters<typeof fetchDelegationMemberOptions>[0];

    return { supabase, calls };
  }

  it("returns members with a display name built from first and last name", async () => {
    const { supabase } = optionsClient([
      { user_id: "u1", first_name: "Alex", last_name: "Rivera" },
      { user_id: "u2", first_name: "Jordan", last_name: "Kim" },
    ]);

    expect(await fetchDelegationMemberOptions(supabase)).toEqual([
      { user_id: "u1", display_name: "Alex Rivera" },
      { user_id: "u2", display_name: "Jordan Kim" },
    ]);
  });

  it("falls back to Anonymous when a profile has no name", async () => {
    const { supabase } = optionsClient([
      { user_id: "u1", first_name: null, last_name: null },
    ]);

    expect(await fetchDelegationMemberOptions(supabase)).toEqual([
      { user_id: "u1", display_name: "Anonymous" },
    ]);
  });

  it("restricts the list to profiles on at least one delegation", async () => {
    const { supabase, calls } = optionsClient([]);

    await fetchDelegationMemberOptions(supabase);

    expect(calls[0].method).toBe("select");
    expect(calls[0].args[0]).toContain("meeting_delegation_members!inner");
  });

  it("throws when the query fails", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              order: () =>
                Promise.resolve({ data: null, error: { message: "boom" } }),
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof fetchDelegationMemberOptions>[0];

    await expect(fetchDelegationMemberOptions(supabase)).rejects.toEqual({
      message: "boom",
    });
  });
});
