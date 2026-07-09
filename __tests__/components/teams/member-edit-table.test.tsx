import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberEditTable } from "@/components/teams/member-edit-table";
import { useMemberStaging } from "@/components/teams/use-member-staging";
import { createClient } from "@/lib/supabase/client";
import type { MembershipWithProfile } from "@/lib/teams";

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
function Harness({ memberships }: { memberships: MembershipWithProfile[] }) {
  const staging = useMemberStaging({
    memberships,
    teamId: "team-1",
    teamSlug: "my-team",
  });
  return (
    <MemberEditTable
      memberships={memberships}
      currentRole={null}
      staging={staging}
      isSaving={false}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
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
