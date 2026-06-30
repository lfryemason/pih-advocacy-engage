import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MeetingsSkeleton } from "@/components/meetings/meetings-skeleton";

describe("MeetingsSkeleton", () => {
  it("exposes a status region announcing the update", () => {
    render(<MeetingsSkeleton />);
    expect(
      screen.getByRole("status", { name: "Updating meetings" }),
    ).toBeInTheDocument();
  });

  it("keeps the real section headings and column headers", () => {
    render(<MeetingsSkeleton />);
    expect(
      screen.getByRole("heading", { name: "Upcoming Meetings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Past Meetings" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader", { name: "Date" }).length,
    ).toBeGreaterThan(0);
  });

  it("renders skeleton placeholders for the rows", () => {
    const { container } = render(<MeetingsSkeleton />);
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });
});
