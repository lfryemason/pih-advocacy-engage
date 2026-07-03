import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MeetingDetail } from "@/components/meetings/meeting-detail";
import { MeetingRow } from "@/lib/meetings/types";
import { server } from "../../mocks/supabase";

const SUPABASE_URL = "http://localhost";

const mockFetchMeetingDetail = vi.hoisted(() => vi.fn());
const mockUpdateMeeting = vi.hoisted(() => vi.fn());
const mockDeleteMeeting = vi.hoisted(() => vi.fn());
const mockSyncDelegationMembers = vi.hoisted(() => vi.fn());
const mockFetchMyTeamMembers = vi.hoisted(() => vi.fn());
// Defaults to a plain member (no id, not admin) so the Delete button stays
// hidden unless a test opts in to admin / scheduling-lead access.
const mockUseCurrentUser = vi.hoisted(() =>
  vi.fn((): { userId: string | null; isAdmin: boolean } => ({
    userId: null,
    isAdmin: false,
  })),
);

vi.mock("@/lib/meetings/queries", () => ({
  fetchMeetingDetail: mockFetchMeetingDetail,
  updateMeeting: mockUpdateMeeting,
  deleteMeeting: mockDeleteMeeting,
  syncDelegationMembers: mockSyncDelegationMembers,
  fetchMyTeamMembers: mockFetchMyTeamMembers,
}));

vi.mock("@/lib/auth/use-current-user", () => ({
  useCurrentUser: mockUseCurrentUser,
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
    location: null,
    scheduling_lead_name: null,
    follow_up_date: null,
    champion_score: null,
    delegation_user_ids: [],
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
    mockSyncDelegationMembers.mockResolvedValue(undefined);
    mockFetchMyTeamMembers.mockResolvedValue([]);
  });

  it("shows loading indicator while fetching", () => {
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading meeting details",
    );
  });
});

describe("MeetingDetail — error state", () => {
  beforeEach(() => {
    stubEmpty();
    mockFetchMeetingDetail.mockRejectedValue(new Error("Network error"));
    mockUpdateMeeting.mockResolvedValue(undefined);
    mockSyncDelegationMembers.mockResolvedValue(undefined);
    mockFetchMyTeamMembers.mockResolvedValue([]);
  });

  it("shows error message on fetch failure", async () => {
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    await expect(screen.findByRole("alert")).resolves.toHaveTextContent(
      "Network error",
    );
  });
});

describe("MeetingDetail — view mode (default)", () => {
  beforeEach(() => {
    stubEmpty();
    mockFetchMeetingDetail.mockResolvedValue(mockDetail);
    mockUpdateMeeting.mockResolvedValue(undefined);
    mockSyncDelegationMembers.mockResolvedValue(undefined);
    mockFetchMyTeamMembers.mockResolvedValue([]);
  });

  it("shows read-only panel with Edit Meeting button by default", async () => {
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    expect(
      await screen.findByRole("button", { name: /Edit Meeting/i }),
    ).toBeInTheDocument();
  });

  it("does not show the edit form by default", async () => {
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    await screen.findByRole("button", { name: /Edit Meeting/i });
    expect(
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();
  });

  it("shows notes and location from fetched detail", async () => {
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    await screen.findByRole("button", { name: /Edit Meeting/i });
    expect(screen.getByText("Test notes")).toBeInTheDocument();
    expect(screen.getByText("DC")).toBeInTheDocument();
  });
});

describe("MeetingDetail — mode toggle", () => {
  beforeEach(() => {
    stubEmpty();
    mockFetchMeetingDetail.mockResolvedValue(mockDetail);
    mockUpdateMeeting.mockResolvedValue(undefined);
    mockSyncDelegationMembers.mockResolvedValue(undefined);
    mockFetchMyTeamMembers.mockResolvedValue([]);
  });

  it("clicking Edit Meeting switches to edit form", async () => {
    const user = userEvent.setup();
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    const editBtn = await screen.findByRole("button", {
      name: /Edit Meeting/i,
    });
    await user.click(editBtn);
    expect(
      await screen.findByRole("button", { name: "Save changes" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Edit Meeting/i }),
    ).not.toBeInTheDocument();
  });

  it("Cancel from edit returns to read-only panel without calling onSaved", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<MeetingDetail meeting={makeRow()} onSaved={onSaved} />);
    const editBtn = await screen.findByRole("button", {
      name: /Edit Meeting/i,
    });
    await user.click(editBtn);
    await screen.findByRole("button", { name: "Save changes" });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      await screen.findByRole("button", { name: /Edit Meeting/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(mockUpdateMeeting).not.toHaveBeenCalled();
  });

  it("Save from edit calls updateMeeting and onSaved then returns to read-only", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<MeetingDetail meeting={makeRow()} onSaved={onSaved} />);
    const editBtn = await screen.findByRole("button", {
      name: /Edit Meeting/i,
    });
    await user.click(editBtn);
    await screen.findByRole("button", { name: "Save changes" });

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateMeeting).toHaveBeenCalledOnce();
    });
    expect(onSaved).toHaveBeenCalledOnce();
    expect(
      await screen.findByRole("button", { name: /Edit Meeting/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();
  });

  it("pre-populates form fields from fetched detail after entering edit mode", async () => {
    const user = userEvent.setup();
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    const editBtn = await screen.findByRole("button", {
      name: /Edit Meeting/i,
    });
    await user.click(editBtn);

    expect(await screen.findByDisplayValue("Test notes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("DC")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2099-06-01")).toBeInTheDocument();
  });

  it("pre-populates existing links after entering edit mode", async () => {
    const user = userEvent.setup();
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    const editBtn = await screen.findByRole("button", {
      name: /Edit Meeting/i,
    });
    await user.click(editBtn);

    await screen.findByDisplayValue("Test notes");
    expect(screen.getByLabelText("Link 1 label")).toHaveValue("Agenda");
    expect(screen.getByLabelText("Link 1 URL")).toHaveValue(
      "https://example.com",
    );
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
    mockSyncDelegationMembers.mockResolvedValue(undefined);
    mockFetchMyTeamMembers.mockResolvedValue([]);
  });

  it("shows error when date is empty and save is attempted", async () => {
    const user = userEvent.setup();
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);

    const editBtn = await screen.findByRole("button", {
      name: /Edit Meeting/i,
    });
    await user.click(editBtn);
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
    mockSyncDelegationMembers.mockResolvedValue(undefined);
    mockFetchMyTeamMembers.mockResolvedValue([]);
  });

  it("shows error when notes exceed 255 characters", async () => {
    const user = userEvent.setup();
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);

    const editBtn = await screen.findByRole("button", {
      name: /Edit Meeting/i,
    });
    await user.click(editBtn);
    await screen.findByRole("button", { name: "Save changes" });

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Notes must be 255 characters",
    );
    expect(mockUpdateMeeting).not.toHaveBeenCalled();
  });
});

function leadMember(userId: string) {
  return {
    id: `dm-${userId}`,
    user_id: userId,
    first_name: "Lead",
    last_name: "Member",
    pronouns: null,
    display_name: "Lead Member",
    email: null,
    role: "scheduling_lead" as const,
    team_id: null,
    team_name_snapshot: null,
  };
}

describe("MeetingDetail — delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubEmpty();
    mockFetchMeetingDetail.mockResolvedValue(mockDetail);
    mockUpdateMeeting.mockResolvedValue(undefined);
    mockDeleteMeeting.mockResolvedValue(undefined);
    mockSyncDelegationMembers.mockResolvedValue(undefined);
    mockFetchMyTeamMembers.mockResolvedValue([]);
    // Default: an admin, so the Delete button is present for flow tests.
    mockUseCurrentUser.mockReturnValue({ userId: "user-1", isAdmin: true });
  });

  async function enterEditMode(user: ReturnType<typeof userEvent.setup>) {
    const editBtn = await screen.findByRole("button", {
      name: /Edit Meeting/i,
    });
    await user.click(editBtn);
    await screen.findByRole("button", { name: "Save changes" });
  }

  it("shows a Delete button to admins", async () => {
    const user = userEvent.setup();
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    await enterEditMode(user);

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("shows a Delete button to the meeting's scheduling lead", async () => {
    mockUseCurrentUser.mockReturnValue({ userId: "user-2", isAdmin: false });
    mockFetchMeetingDetail.mockResolvedValue({
      ...mockDetail,
      delegation_members: [leadMember("user-2")],
    });
    const user = userEvent.setup();
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    await enterEditMode(user);

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides the Delete button from a member who is neither admin nor lead", async () => {
    mockUseCurrentUser.mockReturnValue({ userId: "user-3", isAdmin: false });
    mockFetchMeetingDetail.mockResolvedValue({
      ...mockDetail,
      delegation_members: [leadMember("user-2")],
    });
    const user = userEvent.setup();
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    await enterEditMode(user);

    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("requires confirmation before deleting", async () => {
    const user = userEvent.setup();
    render(<MeetingDetail meeting={makeRow()} onSaved={vi.fn()} />);
    await enterEditMode(user);

    // Clicking Delete only opens the confirmation dialog; it must not delete yet.
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(mockDeleteMeeting).not.toHaveBeenCalled();
  });

  it("deletes and calls onSaved when the confirmation is accepted", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<MeetingDetail meeting={makeRow()} onSaved={onSaved} />);
    await enterEditMode(user);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Delete meeting" }),
    );

    await waitFor(() => expect(mockDeleteMeeting).toHaveBeenCalledOnce());
    expect(mockDeleteMeeting).toHaveBeenCalledWith(
      expect.anything(),
      "meeting-1",
    );
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it("canceling the confirmation does not delete", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<MeetingDetail meeting={makeRow()} onSaved={onSaved} />);
    await enterEditMode(user);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(mockDeleteMeeting).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("shows an error and does not call onSaved when delete fails", async () => {
    mockDeleteMeeting.mockRejectedValue(new Error("Delete blocked"));
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<MeetingDetail meeting={makeRow()} onSaved={onSaved} />);
    await enterEditMode(user);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Delete meeting" }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Delete blocked",
    );
    expect(onSaved).not.toHaveBeenCalled();
  });
});
