import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createClient } from "@/lib/supabase/client";
import { SenatorsTable } from "@/components/representatives/senators-table";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = jest.mocked(createClient);

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function buildChain(
  data: unknown[] | null,
  count: number | null,
  error: unknown = null,
) {
  const selectFn = jest.fn((...args: unknown[]) => {
    if (typeof args[1] === "object" && args[1] !== null && "head" in args[1]) {
      return {
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ count, error: null })),
        })),
      };
    }
    return {
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data, error })),
            })),
          })),
        })),
      })),
    };
  });

  return { from: jest.fn(() => ({ select: selectFn })) };
}

function makeSenator(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-1",
    bioguide_id: "S000001",
    first_name: "Jane",
    last_name: "Doe",
    official_full_name: "Jane Doe",
    chamber: "sen",
    state: "MA",
    district: null,
    party: "Democrat",
    state_rank: "senior",
    birthday: "1960-01-01",
    in_office: true,
    general_links: [],
    org_links: { pihe: [] },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("SenatorsTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockCreateClient.mockReturnValue(buildChain([], 0) as never);
    render(<SenatorsTable />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders senators when data is returned", async () => {
    const senators = [
      makeSenator(),
      makeSenator({
        id: "uuid-2",
        bioguide_id: "S000002",
        official_full_name: "John Smith",
      }),
    ];
    mockCreateClient.mockReturnValue(buildChain(senators, 2) as never);

    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("renders header columns", async () => {
    mockCreateClient.mockReturnValue(
      buildChain([makeSenator()], 1) as never,
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
    const senator = makeSenator({
      official_full_name: "Elizabeth Warren",
      state: "MA",
      party: "Democrat",
    });
    mockCreateClient.mockReturnValue(buildChain([senator], 1) as never);
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Elizabeth Warren")).toBeInTheDocument();
    });
    expect(screen.getByText("MA")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("falls back to first_name + last_name when official_full_name is null", async () => {
    const senator = makeSenator({
      official_full_name: null,
      first_name: "Jane",
      last_name: "Smith",
    });
    mockCreateClient.mockReturnValue(buildChain([senator], 1) as never);
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  it("renders party badge with correct initial for each party", async () => {
    const senators = [
      makeSenator({ id: "1", bioguide_id: "D001", party: "Democrat" }),
      makeSenator({ id: "2", bioguide_id: "R001", party: "Republican" }),
      makeSenator({ id: "3", bioguide_id: "I001", party: "Independent" }),
    ];
    mockCreateClient.mockReturnValue(buildChain(senators, 3) as never);
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("D")).toBeInTheDocument();
    });
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
  });

  it("navigates to detail page on row click", async () => {
    const senator = makeSenator({ bioguide_id: "W000817" });
    mockCreateClient.mockReturnValue(buildChain([senator], 1) as never);
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("row", { name: /Jane Doe/ }));
    expect(mockPush).toHaveBeenCalledWith("/representatives/W000817");
  });

  it("renders empty state when no senators found", async () => {
    mockCreateClient.mockReturnValue(buildChain([], 0) as never);
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("No senators found.")).toBeInTheDocument();
    });
  });

  it("renders error state when query fails", async () => {
    mockCreateClient.mockReturnValue(
      buildChain(null, 0, { message: "Something went wrong" }) as never,
    );
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load senators."),
      ).toBeInTheDocument();
    });
  });

  it("does not show pagination when totalPages is 1", async () => {
    mockCreateClient.mockReturnValue(
      buildChain([makeSenator()], 1) as never,
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
    mockCreateClient.mockReturnValue(
      buildChain([makeSenator()], 50) as never,
    );
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("disables Next on last page and enables Previous", async () => {
    // First render returns page 0 data
    const chain = buildChain([makeSenator()], 50);
    mockCreateClient.mockReturnValue(chain as never);
    render(<SenatorsTable />);

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    // Click Next to go to page 1
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("renders multiple senator rows", async () => {
    const senators = Array.from({ length: 5 }, (_, i) =>
      makeSenator({
        id: `uuid-${i}`,
        bioguide_id: `S00000${i}`,
        official_full_name: `Senator ${i}`,
      }),
    );
    mockCreateClient.mockReturnValue(buildChain(senators, 5) as never);
    render(<SenatorsTable />);

    await waitFor(() => {
      // 5 data rows + 1 header row
      expect(screen.getAllByRole("row")).toHaveLength(6);
    });
  });
});
