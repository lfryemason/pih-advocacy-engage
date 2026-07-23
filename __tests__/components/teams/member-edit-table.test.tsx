import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberEditTable } from "@/components/teams/member-edit-table";
import { useMemberStaging } from "@/components/teams/use-member-staging";
import { createClient } from "@/lib/supabase/client";
import type { MembershipWithProfile } from "@/lib/teams";
import type { CurrentRole } from "@/lib/auth/role";

// The table is now presentational: it stages role changes / removals through
// the hook and writes nothing until the parent commits. So these tests just
// confirm the staged UI, never that Supabase is touched (commit lives in the
// EditTeamForm tests).
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

// Server-only module reached through the staging hook; mocked so it doesn't
// pull `server-only` into the jsdom environment.
vi.mock("@/lib/teams/placeholder-actions", () => ({
  createPlaceholderTeammate: vi.fn(),
  updatePlaceholderTeammate: vi.fn(),
  deletePlaceholderTeammate: vi.fn(),
}));

// Backs the "add existing member" search box (AddExistingMemberSearch ->
// UserSearchCombobox).
const mockSearchProfiles = vi.hoisted(() => vi.fn());
const mockFetchMyTeamMembers = vi.hoisted(() => vi.fn());
vi.mock("@/lib/meetings/queries", () => ({
  searchProfiles: mockSearchProfiles,
  fetchMyTeamMembers: mockFetchMyTeamMembers,
}));

const COORDINATOR: MembershipWithProfile = {
  role: "team_coordinator",
  user_id: "user-1",
  profiles: {
    first_name: "Test",
    last_name: "Admin",
    pronouns: null,
    email: "admin@example.com",
    is_placeholder: false,
  },
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

// Renders the table wired to a real staging hook, the way EditTeamForm does.
function Harness({
  memberships,
  currentRole = null,
}: {
  memberships: MembershipWithProfile[];
  currentRole?: CurrentRole | null;
}) {
  const staging = useMemberStaging({
    memberships,
    teamId: "team-1",
    teamSlug: "my-team",
  });
  return (
    <MemberEditTable
      memberships={memberships}
      currentRole={currentRole}
      staging={staging}
      isSaving={false}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchMyTeamMembers.mockResolvedValue([]);
  mockSearchProfiles.mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MemberEditTable — removal staging", () => {
  it("marks a member pending removal without touching Supabase", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Harness memberships={[COORDINATOR, MEMBER]} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Remove Test Admin/ }),
    );

    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Remove Test Admin/ }),
    ).not.toBeInTheDocument();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("does not stage the removal when the confirmation is dismissed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<Harness memberships={[COORDINATOR]} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Remove Test Admin/ }),
    );

    expect(
      screen.getByRole("button", { name: /Remove Test Admin/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
  });

  it("Undo restores the Remove button and clears the pending state", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Harness memberships={[COORDINATOR]} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Remove Test Admin/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(
      screen.getByRole("button", { name: /Remove Test Admin/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
  });
});

describe("MemberEditTable — role change staging", () => {
  it("updates the dropdown value locally without touching Supabase", async () => {
    render(<Harness memberships={[COORDINATOR]} />);

    const roleSelect = screen.getByRole("combobox");
    await userEvent.selectOptions(roleSelect, "member");

    expect(roleSelect).toHaveValue("member");
    expect(createClient).not.toHaveBeenCalled();
  });
});

const CURRENT_USER: CurrentRole = {
  user_id: "user-1",
  role: "member",
  org_id: "pihe",
};

describe("MemberEditTable — add existing member", () => {
  beforeEach(() => {
    mockSearchProfiles.mockResolvedValue([
      {
        user_id: "user-3",
        display_name: "Jamie Lee",
        first_name: "Jamie",
        last_name: "Lee",
        pronouns: null,
        email: "jamie@example.com",
        teams: [],
      },
    ]);
  });

  it("stages a new row with the default member role after picking a search result", async () => {
    const user = userEvent.setup();
    render(<Harness memberships={[COORDINATOR]} currentRole={CURRENT_USER} />);

    await user.type(
      screen.getByPlaceholderText("Add existing member…"),
      "Jamie",
    );
    await screen.findByText("Jamie Lee");
    await user.click(screen.getByText("Jamie Lee"));

    expect(screen.getAllByText("Jamie Lee")).not.toHaveLength(0);
    const roleSelect = screen.getByRole("combobox", {
      name: "Role for Jamie Lee",
    });
    expect(roleSelect).toHaveValue("member");
  });

  it("removes a staged existing-member row", async () => {
    const user = userEvent.setup();
    render(<Harness memberships={[COORDINATOR]} currentRole={CURRENT_USER} />);

    await user.type(
      screen.getByPlaceholderText("Add existing member…"),
      "Jamie",
    );
    await screen.findByText("Jamie Lee");
    await user.click(screen.getByText("Jamie Lee"));
    await user.click(
      screen.getByRole("button", { name: /Remove Jamie Lee from team/ }),
    );

    expect(screen.queryByText("Jamie Lee")).not.toBeInTheDocument();
  });

  it("excludes already-listed members from search results", async () => {
    const user = userEvent.setup();
    mockSearchProfiles.mockResolvedValue([
      {
        user_id: COORDINATOR.user_id,
        display_name: "Test Admin",
        first_name: "Test",
        last_name: "Admin",
        pronouns: null,
        email: "admin@example.com",
        teams: [],
      },
    ]);
    render(<Harness memberships={[COORDINATOR]} currentRole={CURRENT_USER} />);

    await user.type(
      screen.getByPlaceholderText("Add existing member…"),
      "Test",
    );

    expect(await screen.findByText("No results")).toBeInTheDocument();
  });
});
