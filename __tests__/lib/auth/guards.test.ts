import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CurrentProfile } from "@/lib/auth/profile";

const getCurrentProfile = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("@/lib/auth/profile", () => ({
  getCurrentProfile: () => getCurrentProfile(),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

async function loadGuards() {
  return await import("@/lib/auth/guards");
}

function profile(overrides: Partial<CurrentProfile> = {}): CurrentProfile {
  return {
    user_id: "user-1",
    role: "member",
    org_id: "org-pihe",
    org_slug: "pihe",
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  getCurrentProfile.mockReset();
  redirect.mockClear();
});

describe("requireProfile", () => {
  it("redirects to /auth/login when unauthenticated", async () => {
    getCurrentProfile.mockResolvedValue(null);
    const { requireProfile } = await loadGuards();

    await expect(requireProfile()).rejects.toThrow("REDIRECT:/auth/login");
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("returns the profile when authenticated", async () => {
    getCurrentProfile.mockResolvedValue(profile());
    const { requireProfile } = await loadGuards();

    await expect(requireProfile()).resolves.toEqual(profile());
  });
});

describe("requireSuperAdmin", () => {
  it("throws ForbiddenError for members", async () => {
    getCurrentProfile.mockResolvedValue(profile({ role: "member" }));
    const { requireSuperAdmin, ForbiddenError } = await loadGuards();

    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws ForbiddenError for org admins", async () => {
    getCurrentProfile.mockResolvedValue(profile({ role: "org_admin" }));
    const { requireSuperAdmin, ForbiddenError } = await loadGuards();

    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("passes for super admins", async () => {
    const superProfile = profile({
      role: "super_admin",
      org_id: null,
      org_slug: null,
    });
    getCurrentProfile.mockResolvedValue(superProfile);
    const { requireSuperAdmin } = await loadGuards();

    await expect(requireSuperAdmin()).resolves.toEqual(superProfile);
  });
});

describe("requireOrgAdmin", () => {
  it("throws ForbiddenError for members", async () => {
    getCurrentProfile.mockResolvedValue(profile({ role: "member" }));
    const { requireOrgAdmin, ForbiddenError } = await loadGuards();

    await expect(requireOrgAdmin()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("passes for org admins of any org when no orgId is specified", async () => {
    getCurrentProfile.mockResolvedValue(profile({ role: "org_admin" }));
    const { requireOrgAdmin } = await loadGuards();

    await expect(requireOrgAdmin()).resolves.toMatchObject({
      role: "org_admin",
    });
  });

  it("throws ForbiddenError for org admins of a different org", async () => {
    getCurrentProfile.mockResolvedValue(
      profile({ role: "org_admin", org_id: "other-org" }),
    );
    const { requireOrgAdmin, ForbiddenError } = await loadGuards();

    await expect(requireOrgAdmin("org-pihe")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("passes for super admins regardless of orgId", async () => {
    getCurrentProfile.mockResolvedValue(
      profile({ role: "super_admin", org_id: null, org_slug: null }),
    );
    const { requireOrgAdmin } = await loadGuards();

    await expect(requireOrgAdmin("org-pihe")).resolves.toMatchObject({
      role: "super_admin",
    });
  });
});
