import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DelegationForm } from "@/components/meetings/delegation-form";
import type { DelegationMember } from "@/lib/meetings/types";

const mockSearchProfiles = vi.hoisted(() => vi.fn());

vi.mock("@/lib/meetings/queries", () => ({
  searchProfiles: mockSearchProfiles,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

function makeMember(
  overrides: Partial<DelegationMember> = {},
): DelegationMember {
  return {
    id: "dm-1",
    user_id: "user-1",
    first_name: "Alice",
    last_name: "Smith",
    display_name: "Alice Smith",
    email: "alice@example.com",
    role: "scheduling_lead",
    team_id: "team-1",
    team_name_snapshot: "Global Health",
    ...overrides,
  };
}

// T034: Represented-teams derivation logic
describe("DelegationForm — represented teams derivation", () => {
  beforeEach(() => {
    mockSearchProfiles.mockResolvedValue([]);
  });

  it("deduplicates teams when multiple members share the same snapshot", () => {
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[
          makeMember({
            id: "dm-1",
            user_id: "u-1",
            team_name_snapshot: "Global Health",
          }),
          makeMember({
            id: "dm-2",
            user_id: "u-2",
            team_name_snapshot: "Global Health",
          }),
          makeMember({
            id: "dm-3",
            user_id: "u-3",
            team_name_snapshot: "Advocacy",
          }),
        ]}
        onChange={vi.fn()}
      />,
    );
    const teamsSection = screen.getByRole("list", {
      name: /represented teams/i,
    });
    expect(within(teamsSection).getAllByRole("listitem")).toHaveLength(2);
  });

  it("excludes null team_name_snapshot from represented teams", () => {
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[makeMember({ team_name_snapshot: null })]}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("list", { name: /represented teams/i }),
    ).not.toBeInTheDocument();
  });

  it("excludes blank team_name_snapshot from represented teams", () => {
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[makeMember({ team_name_snapshot: "   " })]}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("list", { name: /represented teams/i }),
    ).not.toBeInTheDocument();
  });

  it("shows empty represented teams when delegation is empty", () => {
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[]}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("list", { name: /represented teams/i }),
    ).not.toBeInTheDocument();
  });
});

// T035: delegation-form UI tests
describe("DelegationForm — member list display", () => {
  beforeEach(() => {
    mockSearchProfiles.mockResolvedValue([]);
  });

  it("shows initial members in the list", () => {
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[makeMember()]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("shows role label for each member", () => {
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[makeMember({ role: "scheduling_lead" })]}
        onChange={vi.fn()}
      />,
    );
    const roleSelect = screen.getByRole("combobox", {
      name: /role for alice smith/i,
    });
    expect((roleSelect as HTMLSelectElement).value).toBe("scheduling_lead");
  });
});

describe("DelegationForm — add member", () => {
  beforeEach(() => {
    mockSearchProfiles.mockResolvedValue([
      {
        user_id: "user-2",
        display_name: "Bob Jones",
        teams: [{ team_id: "team-2", team_name: "Advocacy" }],
      },
    ]);
  });

  it("adds a member after searching, selecting, and confirming", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[]}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: /search/i }), "Bob");
    await screen.findByText("Bob Jones");
    await user.click(screen.getByText("Bob Jones"));
    await user.click(
      screen.getByRole("button", { name: /add to delegation/i }),
    );

    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: "user-2",
          display_name: "Bob Jones",
        }),
      ]),
    );
  });
});

describe("DelegationForm — remove member", () => {
  beforeEach(() => {
    mockSearchProfiles.mockResolvedValue([]);
  });

  it("removes a member when remove button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[makeMember()]}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /remove alice smith/i }),
    );

    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

describe("DelegationForm — role update", () => {
  beforeEach(() => {
    mockSearchProfiles.mockResolvedValue([]);
  });

  it("updates role dropdown for a member and calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[makeMember({ role: "scheduling_lead" })]}
        onChange={onChange}
      />,
    );

    const roleSelect = screen.getByRole("combobox", {
      name: /role for alice smith/i,
    });
    await user.selectOptions(roleSelect, "attendee_talking");

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: "attendee_talking" }),
      ]),
    );
  });
});

// T036: Snapshot tests
describe("DelegationForm — snapshots", () => {
  beforeEach(() => {
    mockSearchProfiles.mockResolvedValue([]);
  });

  it("matches snapshot with empty delegation", () => {
    const { container } = render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[]}
        onChange={vi.fn()}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with delegation members", () => {
    const { container } = render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[
          makeMember({
            id: "dm-1",
            display_name: "Alice Smith",
            role: "scheduling_lead",
            team_name_snapshot: "Global Health",
          }),
          makeMember({
            id: "dm-2",
            user_id: "u-2",
            first_name: "Bob",
            last_name: "Jones",
            display_name: "Bob Jones",
            email: null,
            role: "attendee_talking",
            team_id: "team-2",
            team_name_snapshot: "Advocacy",
          }),
        ]}
        onChange={vi.fn()}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
