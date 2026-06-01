import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MeetingDetail } from "@/components/meetings/meeting-detail";
import { MeetingRow } from "@/lib/meetings/types";
import { server } from "../../mocks/supabase";

const SUPABASE_URL = "http://localhost";

const mockFetchMeetingDetail = vi.hoisted(() => vi.fn());
const mockUpdateMeeting = vi.hoisted(() => vi.fn());

vi.mock("@/lib/meetings/queries", () => ({
  fetchMeetingDetail: mockFetchMeetingDetail,
  updateMeeting: mockUpdateMeeting,
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
    representative_state: "WA",
    representative_district: 9,
    representative_party: "Democrat",
    congressional_contact_id: null,
    congressional_contact_name: "Jane Rep",
    primary_team_id: null,
    primary_team_name: null,
    primary_team_slug: null,
    scheduling_lead_name: null,
    follow_up_date: null,
    champion_score: null,
    ...overrides,
  };
}

const mockDetail = {
  ...makeRow(),
  notes: "Test notes",
  location: "DC",
  links: [{ label: "Agenda", url: "https://example.com" }],
  delegation_members: [],
  represented_teams: [],
};

function stubEmpty() {
  server.use(
    http.get(`${SUPABASE_URL}/rest/v1/representatives`, () =>
      HttpResponse.json([]),
    ),
    http.get(`${SUPABASE_URL}/rest/v1/staffers`, () => HttpResponse.json([])),
    http.get(`${SUPABASE_URL}/rest/v1/teams`, () => HttpResponse.json([])),
    http.get(`${SUPABASE_URL}/rest/v1/team_memberships`, () =>
      HttpResponse.json([]),
    ),
    http.get(`${SUPABASE_URL}/rest/v1/profiles`, () =>
      HttpResponse.json(null, { status: 406 }),
    ),
  );
}

describe("MeetingDetail — loading state", () => {
  beforeEach(() => {
    stubEmpty();
    mockFetchMeetingDetail.mockReturnValue(new Promise(() => {}));
    mockUpdateMeeting.mockResolvedValue(undefined);
  });

  it("shows loading indicator while fetching", () => {
    render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading meeting details",
    );
  });

  it("matches snapshot in loading state", () => {
    const { asFragment } = render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

describe("MeetingDetail — error state", () => {
  beforeEach(() => {
    stubEmpty();
    mockFetchMeetingDetail.mockRejectedValue(new Error("Network error"));
    mockUpdateMeeting.mockResolvedValue(undefined);
  });

  it("shows error message and close button on fetch failure", async () => {
    render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );
    await expect(screen.findByRole("alert")).resolves.toHaveTextContent(
      "Network error",
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});

describe("MeetingDetail — loaded state", () => {
  beforeEach(() => {
    stubEmpty();
    mockFetchMeetingDetail.mockResolvedValue(mockDetail);
    mockUpdateMeeting.mockResolvedValue(undefined);
  });

  it("pre-populates form fields from fetched detail", async () => {
    render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );
    expect(await screen.findByDisplayValue("Test notes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("DC")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2099-06-01")).toBeInTheDocument();
  });

  it("pre-populates existing links", async () => {
    render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );
    await screen.findByDisplayValue("Test notes");
    expect(screen.getByLabelText("Link 1 label")).toHaveValue("Agenda");
    expect(screen.getByLabelText("Link 1 URL")).toHaveValue(
      "https://example.com",
    );
  });

  it("cancel calls onCollapse without calling updateMeeting", async () => {
    const onCollapse = vi.fn();
    const onSaved = vi.fn();
    const user = userEvent.setup();

    render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={onSaved}
        onCollapse={onCollapse}
      />,
    );
    await screen.findByDisplayValue("Test notes");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCollapse).toHaveBeenCalledOnce();
    expect(mockUpdateMeeting).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("save calls updateMeeting then onSaved and onCollapse", async () => {
    const onCollapse = vi.fn();
    const onSaved = vi.fn();
    const user = userEvent.setup();

    render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={onSaved}
        onCollapse={onCollapse}
      />,
    );
    await screen.findByDisplayValue("Test notes");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateMeeting).toHaveBeenCalledOnce();
    });
    expect(onSaved).toHaveBeenCalledOnce();
    expect(onCollapse).toHaveBeenCalledOnce();
  });

  it("matches snapshot in loaded state", async () => {
    const { asFragment } = render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );
    await screen.findByDisplayValue("Test notes");
    expect(asFragment()).toMatchSnapshot();
  });
});

describe("MeetingDetail — validation: empty date", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubEmpty();
    mockFetchMeetingDetail.mockResolvedValue({
      ...mockDetail,
      meeting_date: "",
    });
    mockUpdateMeeting.mockResolvedValue(undefined);
  });

  it("shows error when date is empty and save is attempted", async () => {
    const user = userEvent.setup();
    render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );
    await screen.findByRole("button", { name: "Save changes" });

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Meeting date is required",
    );
    expect(mockUpdateMeeting).not.toHaveBeenCalled();
  });
});

describe("MeetingDetail — validation: notes too long", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubEmpty();
    mockFetchMeetingDetail.mockResolvedValue({
      ...mockDetail,
      notes: "a".repeat(256),
    });
    mockUpdateMeeting.mockResolvedValue(undefined);
  });

  it("shows error when notes exceed 255 characters", async () => {
    const user = userEvent.setup();
    render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );
    await screen.findByRole("button", { name: "Save changes" });

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Notes must be 255 characters",
    );
    expect(mockUpdateMeeting).not.toHaveBeenCalled();
  });
});

describe("MeetingDetail — validation: champion score out of range", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubEmpty();
    mockFetchMeetingDetail.mockResolvedValue({
      ...mockDetail,
      champion_score: 6,
    });
    mockUpdateMeeting.mockResolvedValue(undefined);
  });

  it("shows error when champion score is out of range", async () => {
    const user = userEvent.setup();
    render(
      <MeetingDetail
        meeting={makeRow()}
        onSaved={vi.fn()}
        onCollapse={vi.fn()}
      />,
    );
    await screen.findByRole("button", { name: "Save changes" });

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Champion score must be between 0 and 5",
    );
    expect(mockUpdateMeeting).not.toHaveBeenCalled();
  });
});
