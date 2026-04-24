import { describe, it, expect, vi, beforeEach } from "vitest";

type RoleRow = {
  user_id: string;
  role: "member" | "org_admin" | "super_admin";
  org_id: string | null;
};

const getUser = vi.fn();
const maybeSingleFn = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: maybeSingleFn }),
      }),
    }),
  })),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <F extends (...a: unknown[]) => unknown>(fn: F) => fn,
  };
});

async function loadRole() {
  const mod = await import("@/lib/auth/role");
  return mod.getCurrentRole();
}

describe("getCurrentRole", () => {
  beforeEach(() => {
    vi.resetModules();
    getUser.mockReset();
    maybeSingleFn.mockReset();
  });

  it("returns null when there is no authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await loadRole();

    expect(result).toBeNull();
    expect(maybeSingleFn).not.toHaveBeenCalled();
  });

  it("returns null when the role row is missing", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    maybeSingleFn.mockResolvedValue({ data: null, error: null });

    const result = await loadRole();

    expect(result).toBeNull();
  });

  it("throws when the query returns an error", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const error = { code: "42501", message: "permission denied" };
    maybeSingleFn.mockResolvedValue({ data: null, error });

    await expect(loadRole()).rejects.toEqual(error);
  });

  it("returns the role row with org_id", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const row: RoleRow = {
      user_id: "user-1",
      role: "member",
      org_id: "pihe",
    };
    maybeSingleFn.mockResolvedValue({ data: row });

    const result = await loadRole();

    expect(result).toEqual({
      user_id: "user-1",
      role: "member",
      org_id: "pihe",
    });
  });

  it("returns super_admin role with null org_id", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u" } } });
    maybeSingleFn.mockResolvedValue({
      data: { user_id: "u", role: "super_admin", org_id: null },
    });

    const result = await loadRole();

    expect(result).toEqual({
      user_id: "u",
      role: "super_admin",
      org_id: null,
    });
  });
});
