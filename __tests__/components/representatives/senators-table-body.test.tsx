import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SenatorsTableBody } from "@/components/representatives/senators-table-body";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

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
  } as Parameters<typeof SenatorsTableBody>[0]["senators"][number];
}

beforeEach(() => {
  mockPush.mockClear();
});

describe("SenatorsTableBody", () => {
  it("renders header columns", () => {
    render(
      <SenatorsTableBody senators={[makeSenator()]} page={0} totalPages={1} />,
    );

    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "State" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Party" }),
    ).toBeInTheDocument();
  });

  it("renders senator name, state, and party badge", () => {
    const senator = makeSenator({
      official_full_name: "Elizabeth Warren",
      state: "MA",
      party: "Democrat",
    });
    render(<SenatorsTableBody senators={[senator]} page={0} totalPages={1} />);

    expect(screen.getByText("Elizabeth Warren")).toBeInTheDocument();
    expect(screen.getByText("MA")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("falls back to first_name + last_name when official_full_name is null", () => {
    const senator = makeSenator({
      official_full_name: null,
      first_name: "Jane",
      last_name: "Smith",
    });
    render(<SenatorsTableBody senators={[senator]} page={0} totalPages={1} />);

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("renders party badge with correct initial for each party", () => {
    const senators = [
      makeSenator({ id: "1", bioguide_id: "D001", party: "Democrat" }),
      makeSenator({ id: "2", bioguide_id: "R001", party: "Republican" }),
      makeSenator({ id: "3", bioguide_id: "I001", party: "Independent" }),
    ];
    render(<SenatorsTableBody senators={senators} page={0} totalPages={1} />);

    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
  });

  it("navigates to detail page on row click", async () => {
    const senator = makeSenator({ bioguide_id: "W000817" });
    render(<SenatorsTableBody senators={[senator]} page={0} totalPages={1} />);

    const row = screen.getByRole("row", { name: /Jane Doe/ });
    await userEvent.click(row);

    expect(mockPush).toHaveBeenCalledWith("/representatives/W000817");
  });

  it("does not show pagination when totalPages is 1", () => {
    render(
      <SenatorsTableBody senators={[makeSenator()]} page={0} totalPages={1} />,
    );

    expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Previous" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
  });

  it("shows pagination when totalPages > 1", () => {
    render(
      <SenatorsTableBody senators={[makeSenator()]} page={0} totalPages={3} />,
    );

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("disables Next on last page and enables Previous", () => {
    render(
      <SenatorsTableBody senators={[makeSenator()]} page={2} totalPages={3} />,
    );

    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("navigates to next page on Next click", async () => {
    render(
      <SenatorsTableBody senators={[makeSenator()]} page={0} totalPages={3} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(mockPush).toHaveBeenCalledWith("/representatives?page=1");
  });

  it("navigates to previous page on Previous click", async () => {
    render(
      <SenatorsTableBody senators={[makeSenator()]} page={1} totalPages={3} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(mockPush).toHaveBeenCalledWith("/representatives?page=0");
  });

  it("renders multiple senator rows", () => {
    const senators = Array.from({ length: 5 }, (_, i) =>
      makeSenator({
        id: `uuid-${i}`,
        bioguide_id: `S00000${i}`,
        official_full_name: `Senator ${i}`,
      }),
    );
    render(<SenatorsTableBody senators={senators} page={0} totalPages={1} />);

    // 5 data rows + 1 header row
    expect(screen.getAllByRole("row")).toHaveLength(6);
  });
});
