import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BetaBanner } from "@/components/homepage/beta-banner";

describe("BetaBanner", () => {
  it("renders the beta notice text", () => {
    render(<BetaBanner />);
    expect(screen.getByText(/beta/i)).toBeInTheDocument();
    expect(screen.getByText(/active development/i)).toBeInTheDocument();
  });

  it("has the beta notice aria-label", () => {
    const { container } = render(<BetaBanner />);
    expect(
      container.querySelector('[aria-label="Beta notice"]'),
    ).toBeInTheDocument();
  });

  it("does not render a dismiss button", () => {
    render(<BetaBanner />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
