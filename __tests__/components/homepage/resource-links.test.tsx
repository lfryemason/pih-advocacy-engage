import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResourceLinks } from "@/components/homepage/resource-links";

describe("ResourceLinks", () => {
  it("renders the Resources section heading", () => {
    render(<ResourceLinks />);
    expect(
      screen.getByRole("heading", { name: /resources/i }),
    ).toBeInTheDocument();
  });

  it("renders all four resource links", () => {
    render(<ResourceLinks />);
    expect(
      screen.getByRole("link", { name: /pih engage resources/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /partners in health/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /tb fighter moc scoresheet/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /community discord/i }),
    ).toBeInTheDocument();
  });

  it("all links open in a new tab", () => {
    render(<ResourceLinks />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("links have correct hrefs", () => {
    render(<ResourceLinks />);
    expect(
      screen.getByRole("link", { name: /pih engage resources/i }),
    ).toHaveAttribute("href", "https://sites.google.com/view/pihengage/home");
    expect(
      screen.getByRole("link", { name: /partners in health/i }),
    ).toHaveAttribute("href", "https://www.pih.org");
    expect(
      screen.getByRole("link", { name: /tb fighter moc scoresheet/i }),
    ).toHaveAttribute(
      "href",
      "https://tbfightertofu.github.io/hill_day/moc_list.html",
    );
    expect(
      screen.getByRole("link", { name: /community discord/i }),
    ).toHaveAttribute("href", "https://discord.gg/pih-advocacy");
  });
});
