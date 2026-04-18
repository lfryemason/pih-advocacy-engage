import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  RepresentativesFilters,
  EMPTY_FILTERS,
  hasActiveFilters,
} from "@/components/representatives/representatives-filters";

describe("hasActiveFilters", () => {
  it("returns false for empty filters", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it("returns true when states has entries", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, states: ["MA"] })).toBe(true);
  });

  it("returns true when parties has entries", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, parties: ["Democrat"] })).toBe(
      true,
    );
  });

  it("returns true when name is non-empty", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, name: "smith" })).toBe(true);
  });

  it("returns false when name is only whitespace", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, name: "   " })).toBe(false);
  });
});

describe("RepresentativesFilters", () => {
  it("shows default labels when no filters are active", () => {
    render(
      <RepresentativesFilters filters={EMPTY_FILTERS} onChange={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: "Filter by state" }),
    ).toHaveTextContent("State");
    expect(
      screen.getByRole("button", { name: "Filter by party" }),
    ).toHaveTextContent("Party");
    expect(screen.getByRole("textbox", { name: "Filter by name" })).toHaveValue(
      "",
    );
  });

  it("does not show Clear all button when no filters are active", () => {
    render(
      <RepresentativesFilters filters={EMPTY_FILTERS} onChange={vi.fn()} />,
    );

    expect(
      screen.queryByRole("button", { name: /Clear all/i }),
    ).not.toBeInTheDocument();
  });

  it("shows state name when a single state is selected", () => {
    render(
      <RepresentativesFilters
        filters={{ ...EMPTY_FILTERS, states: ["MA"] }}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Filter by state" }),
    ).toHaveTextContent("Massachusetts");
  });

  it("shows count when multiple states are selected", () => {
    render(
      <RepresentativesFilters
        filters={{ ...EMPTY_FILTERS, states: ["MA", "CA"] }}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Filter by state" }),
    ).toHaveTextContent("2 states");
  });

  it("shows party count when multiple parties are selected", () => {
    render(
      <RepresentativesFilters
        filters={{ ...EMPTY_FILTERS, parties: ["Democrat", "Republican"] }}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Filter by party" }),
    ).toHaveTextContent("2 parties");
  });

  it("adds a state to the filter when selected in the dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RepresentativesFilters filters={EMPTY_FILTERS} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Filter by state" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Massachusetts" }),
    );

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_FILTERS,
      states: ["MA"],
    });
  });

  it("removes a state from the filter when re-selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RepresentativesFilters
        filters={{ ...EMPTY_FILTERS, states: ["MA"] }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filter by state" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Massachusetts" }),
    );

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, states: [] });
  });

  it("adds a party to the filter when selected in the dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RepresentativesFilters filters={EMPTY_FILTERS} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Filter by party" }));
    await user.click(await screen.findByRole("menuitem", { name: "Democrat" }));

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_FILTERS,
      parties: ["Democrat"],
    });
  });

  it("shows Clear all and clears all filters on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RepresentativesFilters
        filters={{ states: ["MA"], parties: ["Democrat"], name: "smith" }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Clear all/i }));

    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS);
  });

  it("debounces the name input before calling onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RepresentativesFilters filters={EMPTY_FILTERS} onChange={onChange} />,
    );

    const input = screen.getByRole("textbox", { name: "Filter by name" });
    await user.type(input, "jane");

    // Typing 4 chars; debounce should collapse to a single onChange with final value.
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, name: "jane" });
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
