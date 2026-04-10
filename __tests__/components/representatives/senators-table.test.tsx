import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SenatorsTable } from "@/components/representatives/senators-table";
import {
  server,
  representativesHandlers,
  makeRepresentative,
} from "../../mocks/supabase";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("SenatorsTable", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("shows loading state initially", () => {
    server.use(...representativesHandlers([]));
    render(<SenatorsTable />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders senators when data is returned", async () => {
    const senators = [
      makeRepresentative(),
      makeRepresentative({
        id: "uuid-2",
        bioguide_id: "S000002",
        official_full_name: "John Smith",
      }),
    ];
    server.use(...representativesHandlers(senators));
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("renders header columns", async () => {
    server.use(
      ...representativesHandlers([makeRepresentative()]),
    );
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(
        screen.getByRole("columnheader", { name: "Name" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("columnheader", { name: "State" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Party" }),
    ).toBeInTheDocument();
  });

  it("renders senator name, state, and party badge", async () => {
    server.use(
      ...representativesHandlers([
        makeRepresentative({
          official_full_name: "Elizabeth Warren",
          state: "MA",
          party: "Democrat",
        }),
      ]),
    );
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(
        screen.getByText("Elizabeth Warren"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("MA")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("falls back to first_name + last_name when official_full_name is null", async () => {
    server.use(
      ...representativesHandlers([
        makeRepresentative({
          official_full_name: null,
          first_name: "Jane",
          last_name: "Smith",
        }),
      ]),
    );
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  it("renders party badge with correct initial for each party", async () => {
    server.use(
      ...representativesHandlers([
        makeRepresentative({
          id: "1",
          bioguide_id: "D001",
          party: "Democrat",
        }),
        makeRepresentative({
          id: "2",
          bioguide_id: "R001",
          party: "Republican",
        }),
        makeRepresentative({
          id: "3",
          bioguide_id: "I001",
          party: "Independent",
        }),
      ]),
    );
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("D")).toBeInTheDocument();
    });
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
  });

  it("navigates to detail page on row click", async () => {
    server.use(
      ...representativesHandlers([
        makeRepresentative({ bioguide_id: "W000817" }),
      ]),
    );
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("row", { name: /Jane Doe/ }),
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/representatives/W000817",
    );
  });

  it("renders empty state when no senators found", async () => {
    server.use(...representativesHandlers([]));
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(
        screen.getByText("No senators found."),
      ).toBeInTheDocument();
    });
  });

  it("renders error state when query fails", async () => {
    server.use(
      ...representativesHandlers([], "Something went wrong"),
    );
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load senators."),
      ).toBeInTheDocument();
    });
  });

  it("does not show pagination when totalPages is 1", async () => {
    server.use(
      ...representativesHandlers([makeRepresentative()]),
    );
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
  });

  it("shows pagination when more than 25 senators", async () => {
    const senators = Array.from({ length: 30 }, (_, i) =>
      makeRepresentative({
        id: `uuid-${i}`,
        bioguide_id: `S${String(i).padStart(6, "0")}`,
      }),
    );
    server.use(...representativesHandlers(senators));
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Previous" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Next" }),
    ).toBeEnabled();
  });

  it("disables Next on last page and enables Previous", async () => {
    const senators = Array.from({ length: 30 }, (_, i) =>
      makeRepresentative({
        id: `uuid-${i}`,
        bioguide_id: `S${String(i).padStart(6, "0")}`,
      }),
    );
    server.use(...representativesHandlers(senators));
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Next" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Previous" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Next" }),
    ).toBeDisabled();
  });

  it("renders multiple senator rows", async () => {
    const senators = Array.from({ length: 5 }, (_, i) =>
      makeRepresentative({
        id: `uuid-${i}`,
        bioguide_id: `S00000${i}`,
        official_full_name: `Senator ${i}`,
      }),
    );
    server.use(...representativesHandlers(senators));
    render(<SenatorsTable />);

    await waitFor(() => {
      // 5 data rows + 1 header row
      expect(screen.getAllByRole("row")).toHaveLength(6);
    });
  });
});
