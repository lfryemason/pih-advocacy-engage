import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MeetingsFilters,
  EMPTY_MEETING_FILTERS,
  hasActiveMeetingFilters,
} from "@/components/meetings/meetings-filters";

vi.mock("@/lib/meetings/use-meeting-buildings", () => ({
  useMeetingBuildings: () => [
    "Cannon House Office Building",
    "Hart Senate Office Building",
  ],
}));

const DELEGATION_MEMBERS = [
  { user_id: "user-alex", display_name: "Alex Rivera" },
  { user_id: "user-jordan", display_name: "Jordan Kim" },
];

vi.mock("@/lib/meetings/use-delegation-members", () => ({
  useDelegationMembers: (enabled: boolean) =>
    enabled ? DELEGATION_MEMBERS : [],
}));

describe("hasActiveMeetingFilters", () => {
  it("returns false for empty filters", () => {
    expect(hasActiveMeetingFilters(EMPTY_MEETING_FILTERS)).toBe(false);
  });

  it("returns true when states has entries", () => {
    expect(
      hasActiveMeetingFilters({ ...EMPTY_MEETING_FILTERS, states: ["WA"] }),
    ).toBe(true);
  });

  it("returns true when districts has entries", () => {
    expect(
      hasActiveMeetingFilters({ ...EMPTY_MEETING_FILTERS, districts: ["9"] }),
    ).toBe(true);
  });

  it("returns true when parties has entries", () => {
    expect(
      hasActiveMeetingFilters({
        ...EMPTY_MEETING_FILTERS,
        parties: ["Democrat"],
      }),
    ).toBe(true);
  });

  it("returns true when representativeIds has entries", () => {
    expect(
      hasActiveMeetingFilters({
        ...EMPTY_MEETING_FILTERS,
        representativeIds: ["abc"],
      }),
    ).toBe(true);
  });

  it("returns true when dateRange.from is set", () => {
    expect(
      hasActiveMeetingFilters({
        ...EMPTY_MEETING_FILTERS,
        dateRange: { from: "2025-01-01", to: null },
      }),
    ).toBe(true);
  });

  it("returns true when dateRange.to is set", () => {
    expect(
      hasActiveMeetingFilters({
        ...EMPTY_MEETING_FILTERS,
        dateRange: { from: null, to: "2025-01-31" },
      }),
    ).toBe(true);
  });

  it("returns true when buildings has entries", () => {
    expect(
      hasActiveMeetingFilters({
        ...EMPTY_MEETING_FILTERS,
        buildings: ["Hart Senate Office Building"],
      }),
    ).toBe(true);
  });

  it("returns true when isVirtual is set either way", () => {
    expect(
      hasActiveMeetingFilters({ ...EMPTY_MEETING_FILTERS, isVirtual: true }),
    ).toBe(true);
    expect(
      hasActiveMeetingFilters({ ...EMPTY_MEETING_FILTERS, isVirtual: false }),
    ).toBe(true);
  });

  it("returns true when delegationUserIds has entries", () => {
    expect(
      hasActiveMeetingFilters({
        ...EMPTY_MEETING_FILTERS,
        delegationUserIds: ["user-alex"],
      }),
    ).toBe(true);
  });
});

async function openFilters(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^Filters/ }));
}

describe("MeetingsFilters", () => {
  it("shows default labels when no filters are active", async () => {
    const user = userEvent.setup();
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={vi.fn()} />,
    );
    await openFilters(user);
    expect(
      screen.getByRole("button", { name: "Filter by state" }),
    ).toHaveTextContent("State");
    expect(
      screen.queryByRole("button", { name: "Filter by district" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by party" }),
    ).toHaveTextContent("Party");
  });

  it("does not show Clear all when no filters are active", () => {
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={vi.fn()} />,
    );
    expect(
      screen.queryByRole("button", { name: /Clear all/i }),
    ).not.toBeInTheDocument();
  });

  it("adds a state when selected from dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={onChange} />,
    );
    await openFilters(user);
    await user.click(screen.getByRole("button", { name: "Filter by state" }));
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "Washington" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_MEETING_FILTERS,
      states: ["WA"],
    });
  });

  it("removes a state when re-selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters
        filters={{ ...EMPTY_MEETING_FILTERS, states: ["WA"] }}
        onChange={onChange}
      />,
    );
    await openFilters(user);
    await user.click(screen.getByRole("button", { name: "Filter by state" }));
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "Washington" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_MEETING_FILTERS,
      states: [],
    });
  });

  it("adds a party when selected from dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={onChange} />,
    );
    await openFilters(user);
    await user.click(screen.getByRole("button", { name: "Filter by party" }));
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "Democrat" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_MEETING_FILTERS,
      parties: ["Democrat"],
    });
  });

  it("shows Clear all and clears all filters on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters
        filters={{
          ...EMPTY_MEETING_FILTERS,
          states: ["WA"],
          districts: ["9"],
          parties: ["Democrat"],
          buildings: ["Hart Senate Office Building"],
          isVirtual: true,
        }}
        onChange={onChange}
      />,
    );
    await openFilters(user);
    await user.click(screen.getByRole("button", { name: /Clear all/i }));
    expect(onChange).toHaveBeenCalledWith(EMPTY_MEETING_FILTERS);
  });
});

describe("MeetingsFilters — building filter", () => {
  it("shows the default Building label when none selected", async () => {
    const user = userEvent.setup();
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={vi.fn()} />,
    );
    await openFilters(user);
    expect(
      screen.getByRole("button", { name: "Filter by building" }),
    ).toHaveTextContent("Building");
  });

  it("shows selected buildings as chips", async () => {
    const user = userEvent.setup();
    render(
      <MeetingsFilters
        filters={{
          ...EMPTY_MEETING_FILTERS,
          buildings: [
            "Hart Senate Office Building",
            "Cannon House Office Building",
          ],
        }}
        onChange={vi.fn()}
      />,
    );
    await openFilters(user);
    expect(screen.getByText("Hart Senate Office Building")).toBeVisible();
    expect(screen.getByText("Cannon House Office Building")).toBeVisible();
  });

  it("adds a building when selected from the dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={onChange} />,
    );
    await openFilters(user);
    await user.click(
      screen.getByRole("button", { name: "Filter by building" }),
    );
    await user.click(
      await screen.findByRole("menuitemcheckbox", {
        name: "Hart Senate Office Building",
      }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_MEETING_FILTERS,
      buildings: ["Hart Senate Office Building"],
    });
  });
});

describe("MeetingsFilters — meeting format filter", () => {
  it("shows the default Format label by default", async () => {
    const user = userEvent.setup();
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={vi.fn()} />,
    );
    await openFilters(user);
    expect(
      screen.getByRole("button", { name: "Filter by meeting format" }),
    ).toHaveTextContent("Format");
  });

  it("shows a 'Virtual' chip when filtering to virtual meetings", async () => {
    const user = userEvent.setup();
    render(
      <MeetingsFilters
        filters={{ ...EMPTY_MEETING_FILTERS, isVirtual: true }}
        onChange={vi.fn()}
      />,
    );
    await openFilters(user);
    expect(screen.getByText("Virtual")).toBeVisible();
  });

  it("shows an 'In person' chip when filtering to in-person meetings", async () => {
    const user = userEvent.setup();
    render(
      <MeetingsFilters
        filters={{ ...EMPTY_MEETING_FILTERS, isVirtual: false }}
        onChange={vi.fn()}
      />,
    );
    await openFilters(user);
    expect(screen.getByText("In person")).toBeVisible();
  });

  it("sets isVirtual when a format is chosen from the dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={onChange} />,
    );
    await openFilters(user);
    await user.click(
      screen.getByRole("button", { name: "Filter by meeting format" }),
    );
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "Virtual" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_MEETING_FILTERS,
      isVirtual: true,
    });
  });

  it("clears isVirtual when the active format option is unchecked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters
        filters={{ ...EMPTY_MEETING_FILTERS, isVirtual: true }}
        onChange={onChange}
      />,
    );
    await openFilters(user);
    await user.click(
      screen.getByRole("button", { name: "Filter by meeting format" }),
    );
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "Virtual" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_MEETING_FILTERS,
      isVirtual: null,
    });
  });
});

describe("MeetingsFilters — delegation member filter", () => {
  const memberCombobox = () =>
    screen.queryByPlaceholderText("Delegation member");

  it("hides the picker from users who are neither admin nor facilitator", async () => {
    const user = userEvent.setup();
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={vi.fn()} />,
    );
    await openFilters(user);
    expect(memberCombobox()).not.toBeInTheDocument();
  });

  it("shows the picker to admins and facilitators", async () => {
    const user = userEvent.setup();
    render(
      <MeetingsFilters
        filters={EMPTY_MEETING_FILTERS}
        onChange={vi.fn()}
        canFilterByDelegationMember
      />,
    );
    await openFilters(user);
    expect(memberCombobox()).toBeInTheDocument();
  });

  it("adds the selected member to the filters", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters
        filters={EMPTY_MEETING_FILTERS}
        onChange={onChange}
        canFilterByDelegationMember
      />,
    );
    await openFilters(user);
    await user.click(screen.getByPlaceholderText("Delegation member"));
    await user.click(
      await screen.findByRole("option", { name: "Alex Rivera" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_MEETING_FILTERS,
      delegationUserIds: ["user-alex"],
    });
  });

  it("keeps already-selected members out of the option list", async () => {
    const user = userEvent.setup();
    render(
      <MeetingsFilters
        filters={{
          ...EMPTY_MEETING_FILTERS,
          delegationUserIds: ["user-alex"],
        }}
        onChange={vi.fn()}
        canFilterByDelegationMember
      />,
    );
    await openFilters(user);
    await user.click(screen.getByPlaceholderText("Delegation member"));
    expect(
      screen.queryByRole("option", { name: "Alex Rivera" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("option", { name: "Jordan Kim" }),
    ).toBeInTheDocument();
  });

  it("shows a chip naming each selected member", async () => {
    const user = userEvent.setup();
    render(
      <MeetingsFilters
        filters={{
          ...EMPTY_MEETING_FILTERS,
          delegationUserIds: ["user-alex", "user-jordan"],
        }}
        onChange={vi.fn()}
        canFilterByDelegationMember
      />,
    );
    await openFilters(user);
    expect(
      screen.getByRole("button", { name: "Remove Alex Rivera filter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Jordan Kim filter" }),
    ).toBeInTheDocument();
  });

  it("removes only the dismissed member when its chip is cleared", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters
        filters={{
          ...EMPTY_MEETING_FILTERS,
          delegationUserIds: ["user-alex", "user-jordan"],
        }}
        onChange={onChange}
        canFilterByDelegationMember
      />,
    );
    await openFilters(user);
    await user.click(
      screen.getByRole("button", { name: "Remove Alex Rivera filter" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_MEETING_FILTERS,
      delegationUserIds: ["user-jordan"],
    });
  });

  it("clears selected members along with the other filters", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters
        filters={{
          ...EMPTY_MEETING_FILTERS,
          delegationUserIds: ["user-alex"],
        }}
        onChange={onChange}
        canFilterByDelegationMember
      />,
    );
    await openFilters(user);
    await user.click(screen.getByRole("button", { name: /Clear all/i }));
    expect(onChange).toHaveBeenCalledWith(EMPTY_MEETING_FILTERS);
  });
});
