import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamMemberList } from "@/components/teams/team-member-list";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { MembershipWithProfile } from "@/lib/teams";

// The app mounts TooltipProvider in the root layout; the Pending badge's
// tooltip needs it.
function renderWithProvider(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

function makeMembership(
  overrides: Partial<NonNullable<MembershipWithProfile["profiles"]>> = {},
  role = "member",
): MembershipWithProfile {
  return {
    role,
    user_id: `user-${overrides.first_name ?? "x"}`,
    profiles: {
      first_name: "Jane",
      last_name: "Doe",
      pronouns: null,
      email: "jane@example.com",
      is_placeholder: false,
      ...overrides,
    },
  };
}

describe("TeamMemberList", () => {
  it("shows a Pending badge for placeholder members", () => {
    renderWithProvider(
      <TeamMemberList
        memberships={[
          makeMembership({ first_name: "Pending", is_placeholder: true }),
        ]}
      />,
    );
    expect(screen.getByText("Pending Doe")).toBeInTheDocument();
    expect(screen.getByText("Pending", { exact: true })).toBeInTheDocument();
  });

  it("shows no Pending badge for regular members", () => {
    renderWithProvider(<TeamMemberList memberships={[makeMembership()]} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(
      screen.queryByText("Pending", { exact: true }),
    ).not.toBeInTheDocument();
  });
});
