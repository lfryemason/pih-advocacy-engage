import { render, screen } from "@testing-library/react";
import { createClient } from "@/lib/supabase/server";
import { SenatorsTable } from "@/components/representatives/senators-table";

jest.mock("@/lib/supabase/server", () => ({
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

  it("renders senators when data is returned", async () => {
    const senators = [
      makeSenator(),
      makeSenator({
        id: "uuid-2",
        bioguide_id: "S000002",
        official_full_name: "John Smith",
      }),
    ];
    mockCreateClient.mockResolvedValue(buildChain(senators, 2) as never);

    const Component = await SenatorsTable({ searchParams: Promise.resolve({ page: "0" }) });
    render(Component);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("renders empty state when no senators found on page 0", async () => {
    mockCreateClient.mockResolvedValue(buildChain([], 0) as never);

    const Component = await SenatorsTable({ searchParams: Promise.resolve({ page: "0" }) });
    render(Component);

    expect(screen.getByText("No senators found.")).toBeInTheDocument();
  });

  it("renders error state when query fails", async () => {
    mockCreateClient.mockResolvedValue(
      buildChain(null, 0, {
        message: "Something went wrong",
      }) as never,
    );

    const Component = await SenatorsTable({ searchParams: Promise.resolve({ page: "0" }) });
    render(Component);

    expect(screen.getByText("Failed to load senators.")).toBeInTheDocument();
  });

  it("passes correct page and totalPages to body", async () => {
    const senators = [makeSenator()];
    mockCreateClient.mockResolvedValue(buildChain(senators, 50) as never);

    const Component = await SenatorsTable({ searchParams: Promise.resolve({ page: "1" }) });
    render(Component);

    // 50 senators / 25 per page = 2 pages, currently on page 2
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });
});
