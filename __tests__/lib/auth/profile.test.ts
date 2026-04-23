import { describe, it, expect, vi, beforeEach } from "vitest";

type ProfileRow = {
  user_id: string;
  role: "member" | "org_admin" | "super_admin";
  org_id: string | null;
  organizations: { slug: string } | null;
};

const getUser = vi.fn();
const singleFn = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ single: singleFn }),
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

async function loadProfile() {
  const mod = await import("@/lib/auth/profile");
  return mod.getCurrentProfile();
}

describe("getCurrentProfile", () => {
  beforeEach(() => {
    vi.resetModules();
    getUser.mockReset();
    singleFn.mockReset();
  });

  it("returns null when there is no authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await loadProfile();

    expect(result).toBeNull();
    expect(singleFn).not.toHaveBeenCalled();
  });

  it("returns null when the profile row is missing", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    singleFn.mockResolvedValue({ data: null });

    const result = await loadProfile();

    expect(result).toBeNull();
  });

  it("returns the joined profile + org slug", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const row: ProfileRow = {
      user_id: "user-1",
      role: "member",
      org_id: "org-pihe",
      organizations: { slug: "pihe" },
    };
    singleFn.mockResolvedValue({ data: row });

    const result = await loadProfile();

    expect(result).toEqual({
      user_id: "user-1",
      role: "member",
      org_id: "org-pihe",
      org_slug: "pihe",
    });
  });

  it("returns null org_slug for super admins with no org", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u" } } });
    singleFn.mockResolvedValue({
      data: {
        user_id: "u",
        role: "super_admin",
        org_id: null,
        organizations: null,
      },
    });

    const result = await loadProfile();

    expect(result).toEqual({
      user_id: "u",
      role: "super_admin",
      org_id: null,
      org_slug: null,
    });
  });
});
