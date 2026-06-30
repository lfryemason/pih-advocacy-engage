import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamLeadSectionList } from "@/components/teams/team-lead-section-list";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { MembershipWithProfile } from "@/lib/teams";

// The app mounts TooltipProvider in the root layout; the Pending badge's
// tooltip needs it.
function renderWithProvider(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

function makeLead(is_placeholder: boolean): MembershipWithProfile {
  return {
    role: "advocacy_lead",
    user_id: "user-1",
    profiles: {
      first_name: "Alex",
      last_name: "Kim",
      pronouns: null,
      email: "alex@example.com",
      is_placeholder,
    },
  };
}

describe("TeamLeadSectionList", () => {
  it("shows a Pending badge for placeholder leads", () => {
    renderWithProvider(<TeamLeadSectionList memberships={[makeLead(true)]} />);
    expect(screen.getByText("Alex Kim")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows no Pending badge for regular leads", () => {
    renderWithProvider(<TeamLeadSectionList memberships={[makeLead(false)]} />);
    expect(screen.getByText("Alex Kim")).toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
  });
});
