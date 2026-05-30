import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MeetingsFilters,
  EMPTY_MEETING_FILTERS,
  hasActiveMeetingFilters,
} from "@/components/meetings/meetings-filters";

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
});

describe("MeetingsFilters", () => {
  it("shows default labels when no filters are active", () => {
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={vi.fn()} />,
    );
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

  it("shows state name when a single state is selected", () => {
    render(
      <MeetingsFilters
        filters={{ ...EMPTY_MEETING_FILTERS, states: ["WA"] }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Filter by state" }),
    ).toHaveTextContent("Washington");
  });

  it("shows count when multiple states selected", () => {
    render(
      <MeetingsFilters
        filters={{ ...EMPTY_MEETING_FILTERS, states: ["WA", "OR"] }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Filter by state" }),
    ).toHaveTextContent("2 states");
  });

  it("shows district label when a single district is selected", () => {
    render(
      <MeetingsFilters
        filters={{ states: ["WA"], districts: ["9"], parties: [] }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Filter by district" }),
    ).toHaveTextContent("District 9");
  });

  it("shows count when multiple districts selected", () => {
    render(
      <MeetingsFilters
        filters={{ states: ["WA"], districts: ["1", "2"], parties: [] }}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Filter by district" }),
    ).toHaveTextContent("2 districts");
  });

  it("adds a state when selected from dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MeetingsFilters filters={EMPTY_MEETING_FILTERS} onChange={onChange} />,
    );
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
        filters={{ states: ["WA"], districts: ["9"], parties: ["Democrat"] }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Clear all/i }));
    expect(onChange).toHaveBeenCalledWith(EMPTY_MEETING_FILTERS);
  });
});
