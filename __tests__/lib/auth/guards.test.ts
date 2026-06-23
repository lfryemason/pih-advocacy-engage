import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CurrentRole } from "@/lib/auth/role";

const getCurrentRole = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("@/lib/auth/role", () => ({
  getCurrentRole: () => getCurrentRole(),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

async function loadGuards() {
  return await import("@/lib/auth/guards");
}

function current(overrides: Partial<CurrentRole> = {}): CurrentRole {
  return {
    user_id: "user-1",
    role: "member",
    org_id: "pihe",
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  getCurrentRole.mockReset();
  redirect.mockClear();
});

describe("requireRole", () => {
  it("redirects to /auth/login when unauthenticated", async () => {
    getCurrentRole.mockResolvedValue(null);
    const { requireRole } = await loadGuards();

    await expect(requireRole()).rejects.toThrow("REDIRECT:/auth/login");
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("returns the role when authenticated", async () => {
    getCurrentRole.mockResolvedValue(current());
    const { requireRole } = await loadGuards();

    await expect(requireRole()).resolves.toEqual(current());
  });
});

describe("requireSuperAdmin", () => {
  it("throws ForbiddenError for members", async () => {
    getCurrentRole.mockResolvedValue(current({ role: "member" }));
    const { requireSuperAdmin, ForbiddenError } = await loadGuards();

    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws ForbiddenError for org admins", async () => {
    getCurrentRole.mockResolvedValue(current({ role: "org_admin" }));
    const { requireSuperAdmin, ForbiddenError } = await loadGuards();

    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("passes for super admins", async () => {
    const superRole = current({ role: "super_admin", org_id: null });
    getCurrentRole.mockResolvedValue(superRole);
    const { requireSuperAdmin } = await loadGuards();

    await expect(requireSuperAdmin()).resolves.toEqual(superRole);
  });
});

describe("getIsAdmin", () => {
  it("returns false when unauthenticated", async () => {
    getCurrentRole.mockResolvedValue(null);
    const { getIsAdmin } = await loadGuards();

    await expect(getIsAdmin("pihe")).resolves.toBe(false);
  });

  it("returns false for a member", async () => {
    getCurrentRole.mockResolvedValue(current({ role: "member" }));
    const { getIsAdmin } = await loadGuards();

    await expect(getIsAdmin("pihe")).resolves.toBe(false);
  });

  it("returns true for an org admin of the matching org", async () => {
    getCurrentRole.mockResolvedValue(
      current({ role: "org_admin", org_id: "pihe" }),
    );
    const { getIsAdmin } = await loadGuards();

    await expect(getIsAdmin("pihe")).resolves.toBe(true);
  });

  it("returns false for an org admin of a different org", async () => {
    getCurrentRole.mockResolvedValue(
      current({ role: "org_admin", org_id: "other" }),
    );
    const { getIsAdmin } = await loadGuards();

    await expect(getIsAdmin("pihe")).resolves.toBe(false);
  });

  it("returns true for a super admin regardless of org", async () => {
    getCurrentRole.mockResolvedValue(
      current({ role: "super_admin", org_id: null }),
    );
    const { getIsAdmin } = await loadGuards();

    await expect(getIsAdmin("pihe")).resolves.toBe(true);
  });
});

describe("requireOrgAdmin", () => {
  it("throws ForbiddenError for members", async () => {
    getCurrentRole.mockResolvedValue(current({ role: "member" }));
    const { requireOrgAdmin, ForbiddenError } = await loadGuards();

    await expect(requireOrgAdmin("pihe")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("passes for an org admin of the requested org", async () => {
    getCurrentRole.mockResolvedValue(
      current({ role: "org_admin", org_id: "pihe" }),
    );
    const { requireOrgAdmin } = await loadGuards();

    await expect(requireOrgAdmin("pihe")).resolves.toMatchObject({
      role: "org_admin",
    });
  });

  it("throws ForbiddenError for an org admin of a different org", async () => {
    getCurrentRole.mockResolvedValue(
      current({ role: "org_admin", org_id: "other" }),
    );
    const { requireOrgAdmin, ForbiddenError } = await loadGuards();

    await expect(requireOrgAdmin("pihe")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("passes for super admins regardless of orgId", async () => {
    getCurrentRole.mockResolvedValue(
      current({ role: "super_admin", org_id: null }),
    );
    const { requireOrgAdmin } = await loadGuards();

    await expect(requireOrgAdmin("pihe")).resolves.toMatchObject({
      role: "super_admin",
    });
  });
});
