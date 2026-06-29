import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MeetingsSkeleton } from "@/components/meetings/meetings-skeleton";

describe("MeetingsSkeleton", () => {
  it("exposes a status region announcing the update", () => {
    render(<MeetingsSkeleton />);
    const status = screen.getByRole("status", { name: "Updating meetings" });
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent("Updating meetings");
  });

  it("renders placeholder rows for both meeting sections", () => {
    const { container } = render(<MeetingsSkeleton />);
    // 2 section title bars + 5 rows per section = 12 placeholders
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      12,
    );
  });
});
