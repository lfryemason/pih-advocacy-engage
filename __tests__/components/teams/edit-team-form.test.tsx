import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditTeamForm } from "@/components/teams/edit-team-form";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import type { MembershipWithProfile } from "@/lib/teams";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/teams/placeholder-actions", () => ({
  deletePlaceholderTeammate: vi.fn(),
}));

const mockRouterReplace = vi.fn();
const mockRouterRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace, refresh: mockRouterRefresh }),
}));

type Team = Tables<"teams">;

const SEED_TEAM: Team = {
  id: "team-123",
  org_id: "pihe",
  name: "Seattle High School",
  slug: "seattle-high-school",
  state: "WA",
  type: "high_school",
  description: null,
  founded_date: null,
  congressional_districts: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const MEMBER: MembershipWithProfile = {
  role: "member",
  user_id: "user-2",
  profiles: {
    first_name: "Sam",
    last_name: "Patel",
    pronouns: null,
    email: "sam@example.com",
    is_placeholder: false,
  },
};

function mockClient({
  teamUpdateError = null,
  memberDeleteError = null,
}: {
  teamUpdateError?: Error | null;
  memberDeleteError?: Error | null;
} = {}) {
  const teamsUpdateEq = vi.fn().mockResolvedValue({ error: teamUpdateError });
  const teamsUpdate = vi.fn().mockReturnValue({ eq: teamsUpdateEq });

  const membershipEq3 = vi.fn().mockResolvedValue({ error: memberDeleteError });
  const membershipEq2 = vi.fn().mockReturnValue({ eq: membershipEq3 });
  const membershipEq1 = vi.fn().mockReturnValue({ eq: membershipEq2 });
  const membershipDelete = vi.fn().mockReturnValue({ eq: membershipEq1 });

  const client = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "teams") return { update: teamsUpdate };
      return { delete: membershipDelete };
    }),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  };
  return { client, teamsUpdate, membershipDelete };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditTeamForm — Save commits members before team fields", () => {
  it("commits a staged member removal and saves team fields, then navigates away", async () => {
    const { client, teamsUpdate, membershipDelete } = mockClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    render(
      <EditTeamForm
        team={SEED_TEAM}
        canDelete={false}
        memberships={[MEMBER]}
        currentRole={null}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Remove Sam Patel/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(membershipDelete).toHaveBeenCalled();
      expect(teamsUpdate).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/teams/seattle-high-school",
      );
    });
  });

  it("does not save team fields when committing member changes fails", async () => {
    const { client, teamsUpdate, membershipDelete } = mockClient({
      memberDeleteError: new Error("boom"),
    });
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    render(
      <EditTeamForm
        team={SEED_TEAM}
        canDelete={false}
        memberships={[MEMBER]}
        currentRole={null}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Remove Sam Patel/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(membershipDelete).toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent("boom");
    });
    expect(teamsUpdate).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});

describe("EditTeamForm — Cancel discards staged member changes", () => {
  it("navigates away without committing a staged removal", async () => {
    const { client, teamsUpdate, membershipDelete } = mockClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    render(
      <EditTeamForm
        team={SEED_TEAM}
        canDelete={false}
        memberships={[MEMBER]}
        currentRole={null}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Remove Sam Patel/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(membershipDelete).not.toHaveBeenCalled();
    expect(teamsUpdate).not.toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith(
      "/teams/seattle-high-school",
    );
  });
});
