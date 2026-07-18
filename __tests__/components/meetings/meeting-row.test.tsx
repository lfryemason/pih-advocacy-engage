import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetingRow as MeetingRowComponent } from "@/components/meetings/meeting-row";
import { MeetingRow } from "@/lib/meetings/types";

const mockUseCurrentUser = vi.hoisted(() =>
  vi.fn(
    (): {
      userId: string | null;
      isAdmin: boolean;
      isFacilitator: boolean;
    } => ({
      userId: null,
      isAdmin: false,
      isFacilitator: false,
    }),
  ),
);

vi.mock("@/lib/auth/use-current-user", () => ({
  useCurrentUser: mockUseCurrentUser,
}));

vi.mock("@/components/meetings/meeting-detail", () => ({
  MeetingDetail: ({ meeting }: { meeting: MeetingRow }) => (
    <div>Detail panel for {meeting.id}</div>
  ),
}));

function makeRow(overrides: Partial<MeetingRow> = {}): MeetingRow {
  return {
    id: "meeting-1",
    meeting_date: "2099-06-01",
    meeting_time: null,
    meeting_timezone: "America/New_York",
    representative_id: "rep-1",
    representative_bioguide_id: "R000001",
    representative_name: "Jane Rep",
    representative_pronouns: null,
    representative_state: "WA",
    representative_district: 9,
    representative_party: "Democrat",
    congressional_contact_id: null,
    congressional_contact_name: "Jane Rep",
    primary_team_id: null,
    primary_team_name: null,
    primary_team_slug: null,
    location: "123 Main St",
    scheduling_lead_name: null,
    follow_up_date: null,
    champion_score: null,
    delegation_user_ids: [],
    ...overrides,
  };
}

function renderRow(
  props: Partial<React.ComponentProps<typeof MeetingRowComponent>> = {},
) {
  return render(
    <table>
      <tbody>
        <MeetingRowComponent meeting={makeRow()} {...props} />
      </tbody>
    </table>,
  );
}

describe("MeetingRow — view gating", () => {
  it("hides the expand chevron and location for a non-admin, non-delegation user on an upcoming meeting", () => {
    mockUseCurrentUser.mockReturnValue({
      userId: "user-1",
      isAdmin: false,
      isFacilitator: false,
    });
    renderRow({ meeting: makeRow({ delegation_user_ids: ["someone-else"] }) });

    expect(
      screen.queryByRole("button", { name: /Expand meeting/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Location hidden")).toBeInTheDocument();
    expect(screen.queryByText("123 Main St")).not.toBeInTheDocument();
  });

  it("shows the chevron and location for an admin on an upcoming meeting", () => {
    mockUseCurrentUser.mockReturnValue({
      userId: "user-1",
      isAdmin: true,
      isFacilitator: false,
    });
    renderRow({ meeting: makeRow({ delegation_user_ids: [] }) });

    expect(
      screen.getByRole("button", { name: /Expand meeting/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.queryByLabelText("Location hidden")).not.toBeInTheDocument();
  });

  it("shows the chevron and location for a facilitator on an upcoming meeting", () => {
    mockUseCurrentUser.mockReturnValue({
      userId: "user-1",
      isAdmin: false,
      isFacilitator: true,
    });
    renderRow({ meeting: makeRow({ delegation_user_ids: [] }) });

    expect(
      screen.getByRole("button", { name: /Expand meeting/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.queryByLabelText("Location hidden")).not.toBeInTheDocument();
  });

  it("shows the chevron and location for a delegation member on an upcoming meeting", () => {
    mockUseCurrentUser.mockReturnValue({
      userId: "user-1",
      isAdmin: false,
      isFacilitator: false,
    });
    renderRow({
      meeting: makeRow({ delegation_user_ids: ["user-1", "user-2"] }),
    });

    expect(
      screen.getByRole("button", { name: /Expand meeting/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
  });

  it("always shows the chevron and location for past meetings, regardless of admin/delegation status", () => {
    mockUseCurrentUser.mockReturnValue({
      userId: "user-1",
      isAdmin: false,
      isFacilitator: false,
    });
    renderRow({
      meeting: makeRow({ delegation_user_ids: [] }),
      isPast: true,
    });

    expect(
      screen.getByRole("button", { name: /Expand meeting/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
  });

  it("expands to show meeting details when an authorized user clicks the chevron", async () => {
    mockUseCurrentUser.mockReturnValue({
      userId: "user-1",
      isAdmin: true,
      isFacilitator: false,
    });
    renderRow({ meeting: makeRow({ id: "meeting-42" }) });

    await userEvent.click(
      screen.getByRole("button", { name: /Expand meeting/ }),
    );

    expect(screen.getByText("Detail panel for meeting-42")).toBeInTheDocument();
  });

  it("does not expand when a gated user clicks the row", async () => {
    mockUseCurrentUser.mockReturnValue({
      userId: "user-1",
      isAdmin: false,
      isFacilitator: false,
    });
    renderRow({
      meeting: makeRow({ id: "meeting-42", delegation_user_ids: [] }),
    });

    const [dataCell] = screen.getAllByRole("cell");
    await userEvent.click(dataCell);

    expect(
      screen.queryByText("Detail panel for meeting-42"),
    ).not.toBeInTheDocument();
  });
});
