import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RepMeetings } from "@/components/meetings/rep-meetings";
import { fetchMeetings } from "@/lib/meetings/queries";
import { MeetingRow } from "@/lib/meetings/types";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({}),
}));

vi.mock("@/lib/meetings/queries", () => ({
  fetchMeetings: vi.fn(),
}));

const mockFetchMeetings = vi.mocked(fetchMeetings);

function makeRow(overrides: Partial<MeetingRow> = {}): MeetingRow {
  return {
    id: "id-1",
    meeting_date: "2099-06-01",
    meeting_time: null,
    meeting_timezone: "America/New_York",
    representative_id: "rep-123",
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
    follow_up_completed: false,
    champion_score: null,
    delegation_user_ids: [],
    ...overrides,
  };
}

beforeEach(() => {
  mockFetchMeetings.mockReset();
});

describe("RepMeetings", () => {
  it("shows a loading state before meetings resolve", () => {
    mockFetchMeetings.mockReturnValue(new Promise(() => {}));
    render(<RepMeetings representativeId="rep-123" />);
    expect(screen.getByText("Loading meetings…")).toBeInTheDocument();
  });

  it("renders Future and Past Meetings sections once loaded", async () => {
    mockFetchMeetings.mockImplementation(async (_supabase, { section }) =>
      section === "upcoming"
        ? {
            meetings: [makeRow({ id: "u1", meeting_date: "2099-06-01" })],
            count: 1,
          }
        : {
            meetings: [makeRow({ id: "p1", meeting_date: "2020-01-01" })],
            count: 1,
          },
    );
    render(<RepMeetings representativeId="rep-123" />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Future Meetings" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "Past Meetings" }),
    ).toBeInTheDocument();
  });

  it("requests meetings scoped to the representative", async () => {
    mockFetchMeetings.mockResolvedValue({ meetings: [], count: 0 });
    render(<RepMeetings representativeId="rep-123" />);

    await waitFor(() => {
      expect(mockFetchMeetings).toHaveBeenCalledTimes(2);
    });
    expect(mockFetchMeetings).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        representativeId: "rep-123",
        section: "upcoming",
      }),
    );
    expect(mockFetchMeetings).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ representativeId: "rep-123", section: "past" }),
    );
  });

  it("hides the Member of Congress column on the profile", async () => {
    mockFetchMeetings.mockImplementation(async (_supabase, { section }) =>
      section === "upcoming"
        ? { meetings: [makeRow({ id: "u1" })], count: 1 }
        : { meetings: [], count: 0 },
    );
    render(<RepMeetings representativeId="rep-123" />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Future Meetings" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("columnheader", { name: "Member of Congress" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error message when loading fails", async () => {
    mockFetchMeetings.mockRejectedValue(new Error("boom"));
    render(<RepMeetings representativeId="rep-123" />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("boom");
    });
  });

  it("loads more meetings from the current offset when Show more is clicked", async () => {
    mockFetchMeetings.mockImplementation(
      async (_supabase, { section, offset }) => {
        if (section === "past") return { meetings: [], count: 0 };
        // upcoming: first page one row, total 30 so Show more appears
        return {
          meetings: [
            makeRow({ id: `u-${offset}`, meeting_date: "2099-06-01" }),
          ],
          count: 30,
        };
      },
    );
    render(<RepMeetings representativeId="rep-123" />);

    const showMore = await screen.findByRole("button", { name: /Show more/ });
    await userEvent.click(showMore);

    await waitFor(() => {
      expect(mockFetchMeetings).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          representativeId: "rep-123",
          section: "upcoming",
          offset: 1,
        }),
      );
    });
  });
});
