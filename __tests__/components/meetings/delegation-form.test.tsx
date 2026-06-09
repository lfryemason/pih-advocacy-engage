import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DelegationForm } from "@/components/meetings/delegation-form";
import type { DelegationMember } from "@/lib/meetings/types";

const mockSearchProfiles = vi.hoisted(() => vi.fn());
const mockFetchMyTeamMembers = vi.hoisted(() => vi.fn());

vi.mock("@/lib/meetings/queries", () => ({
  searchProfiles: mockSearchProfiles,
  fetchMyTeamMembers: mockFetchMyTeamMembers,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

function makeMember(
  overrides: Partial<DelegationMember> = {},
): DelegationMember {
  return {
    id: "dm-1",
    user_id: "user-1",
    first_name: "Alice",
    last_name: "Smith",
    pronouns: null,
    display_name: "Alice Smith",
    email: "alice@example.com",
    role: "scheduling_lead",
    team_id: "team-1",
    team_name_snapshot: "Global Health",
    ...overrides,
  };
}

beforeEach(() => {
  mockFetchMyTeamMembers.mockResolvedValue([]);
});

// T034: Represented-teams logic moved to MeetingDetailView (read panel).
// Tests live in meeting-detail-view.test.tsx.

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
        first_name: "Bob",
        last_name: "Jones",
        pronouns: null,
        teams: [{ team_id: "team-2", team_name: "Advocacy" }],
      },
    ]);
  });

  it("adds a member immediately when a search result is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[]}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByRole("combobox"), "Bob");
    await screen.findByText("Bob Jones");
    await user.click(screen.getByText("Bob Jones"));

    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: "user-2",
          display_name: "Bob Jones",
          role: "attendee_listening",
        }),
      ]),
    );
  });

  it("adds first result when the plus button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DelegationForm
        meetingId="meeting-1"
        initialMembers={[]}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByRole("combobox"), "Bob");
    await screen.findByText("Bob Jones");
    await user.click(
      screen.getByRole("button", { name: /add to delegation/i }),
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: "user-2",
          role: "attendee_listening",
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
