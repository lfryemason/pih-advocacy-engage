import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditTeamForm } from "@/components/teams/edit-team-form";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import type { MembershipWithProfile } from "@/lib/teams";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

// The staging hook imports these; a removal/role change doesn't reach them.
vi.mock("@/lib/teams/placeholder-actions", () => ({
  createPlaceholderTeammate: vi.fn(),
  updatePlaceholderTeammate: vi.fn(),
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

  // Removals now collapse into delete().eq(team_id).in(user_id).eq(role).
  const eqRole = vi.fn().mockResolvedValue({ error: memberDeleteError });
  const inUser = vi.fn().mockReturnValue({ eq: eqRole });
  const eqTeam = vi.fn().mockReturnValue({ in: inUser });
  const membershipDelete = vi.fn().mockReturnValue({ eq: eqTeam });

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EditTeamForm — Save commits members and team fields together", () => {
  it("commits a staged removal and the team update, then navigates away", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
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

  it("commits a staged role change via change_member_role", async () => {
    const { client } = mockClient();
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

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Role for Sam Patel" }),
      "advocacy_lead",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(client.rpc).toHaveBeenCalledWith("change_member_role", {
        p_team_id: "team-123",
        p_user_id: "user-2",
        p_old_role: "member",
        p_new_role: "advocacy_lead",
      });
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/teams/seattle-high-school",
      );
    });
  });

  it("surfaces an error and does not navigate when a member change fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { client } = mockClient({ memberDeleteError: new Error("boom") });
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
      expect(screen.getByRole("alert")).toHaveTextContent("boom");
    });
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});

describe("EditTeamForm — Cancel discards staged member changes", () => {
  it("navigates away without committing a staged removal", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
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
