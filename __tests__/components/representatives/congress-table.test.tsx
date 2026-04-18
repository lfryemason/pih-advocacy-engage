import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CongressTable } from "@/components/representatives/congress-table";
import {
  server,
  representativesHandlers,
  makeRepresentative,
} from "../../mocks/supabase";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function makeRep(
  overrides: Partial<ReturnType<typeof makeRepresentative>> = {},
) {
  return makeRepresentative({
    chamber: "rep",
    district: 1,
    state_rank: null,
    ...overrides,
  });
}

describe("CongressTable", () => {
  it("shows loading state initially", () => {
    server.use(...representativesHandlers([]));
    render(<CongressTable />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders representatives when data is returned", async () => {
    const reps = [
      makeRep({ official_full_name: "April May" }),
      makeRep({
        id: "uuid-2",
        bioguide_id: "R000002",
        district: 2,
        official_full_name: "Peter Petrawicki",
      }),
    ];
    server.use(...representativesHandlers(reps));
    render(<CongressTable />);

    await waitFor(() => {
      expect(screen.getByText("April May")).toBeInTheDocument();
    });
    expect(screen.getByText("Peter Petrawicki")).toBeInTheDocument();
  });

  it("renders header columns including District", async () => {
    server.use(...representativesHandlers([makeRep()]));
    render(<CongressTable />);

    await waitFor(() => {
      expect(
        screen.getByRole("columnheader", { name: "Name" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("columnheader", { name: "State" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "District" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Party" }),
    ).toBeInTheDocument();
  });

  it("renders rep name, state, district, and party badge", async () => {
    server.use(
      ...representativesHandlers([
        makeRep({
          official_full_name: "April May",
          state: "IN",
          district: 7,
          party: "Democrat",
        }),
      ]),
    );
    render(<CongressTable />);

    await waitFor(() => {
      expect(screen.getByText("April May")).toBeInTheDocument();
    });
    expect(screen.getByText("IN")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("falls back to first_name + last_name when official_full_name is null", async () => {
    server.use(
      ...representativesHandlers([
        makeRep({
          official_full_name: null,
          first_name: "Andy",
          last_name: "Skampt",
        }),
      ]),
    );
    render(<CongressTable />);

    await waitFor(() => {
      expect(screen.getByText("Andy Skampt")).toBeInTheDocument();
    });
  });

  it("renders party badge with correct initial for each party", async () => {
    server.use(
      ...representativesHandlers([
        makeRep({
          id: "1",
          bioguide_id: "R000001",
          district: 1,
          party: "Democrat",
        }),
        makeRep({
          id: "2",
          bioguide_id: "R000002",
          district: 2,
          party: "Republican",
        }),
        makeRep({
          id: "3",
          bioguide_id: "R000003",
          district: 3,
          party: "Independent",
        }),
      ]),
    );
    render(<CongressTable />);

    await waitFor(() => {
      expect(screen.getByText("D")).toBeInTheDocument();
    });
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
  });

  it("renders name as a link to detail page", async () => {
    server.use(
      ...representativesHandlers([
        makeRep({
          bioguide_id: "R000002",
          official_full_name: "Peter Petrawicki",
        }),
      ]),
    );
    render(<CongressTable />);

    await waitFor(() => {
      expect(screen.getByText("Peter Petrawicki")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: "Peter Petrawicki" });
    expect(link).toHaveAttribute("href", "/representatives/R000002");
  });

  it("renders empty state when no representatives found", async () => {
    server.use(...representativesHandlers([]));
    render(<CongressTable />);

    await waitFor(() => {
      expect(screen.getByText("No representatives found.")).toBeInTheDocument();
    });
  });

  it("renders error state when query fails", async () => {
    server.use(...representativesHandlers([], "Something went wrong"));
    render(<CongressTable />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load representatives."),
      ).toBeInTheDocument();
    });
  });

  it("does not show pagination when totalPages is 1", async () => {
    server.use(...representativesHandlers([makeRep()]));
    render(<CongressTable />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
  });

  it("shows pagination when more than 25 representatives", async () => {
    const reps = Array.from({ length: 30 }, (_, i) =>
      makeRep({
        id: `uuid-${i}`,
        bioguide_id: `R${String(i).padStart(6, "0")}`,
        district: i + 1,
      }),
    );
    server.use(...representativesHandlers(reps));
    render(<CongressTable />);

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("disables Next on last page and enables Previous", async () => {
    const reps = Array.from({ length: 30 }, (_, i) =>
      makeRep({
        id: `uuid-${i}`,
        bioguide_id: `R${String(i).padStart(6, "0")}`,
        district: i + 1,
      }),
    );
    server.use(...representativesHandlers(reps));
    render(<CongressTable />);

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("renders multiple representative rows", async () => {
    const reps = Array.from({ length: 5 }, (_, i) =>
      makeRep({
        id: `uuid-${i}`,
        bioguide_id: `R00000${i}`,
        district: i + 1,
        official_full_name: `Rep ${i}`,
      }),
    );
    server.use(...representativesHandlers(reps));
    render(<CongressTable />);

    await waitFor(() => {
      // 5 data rows + 1 header row
      expect(screen.getAllByRole("row")).toHaveLength(6);
    });
  });
});
