import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MeetingsSection } from "@/components/meetings/meetings-section";
import { MeetingRow as MeetingRowComponent } from "@/components/meetings/meeting-row";
import { MeetingRow } from "@/lib/meetings/types";

function makeRow(overrides: Partial<MeetingRow> = {}): MeetingRow {
  return {
    id: "id-1",
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
    ...overrides,
  };
}

function sectionProps(meetings: MeetingRow[], extra?: { totalCount?: number }) {
  return {
    totalCount: extra?.totalCount ?? meetings.length,
    onShowMore: vi.fn(),
    disableLoadMore: false,
  };
}

describe("MeetingsSection", () => {
  it("renders the section title as a heading", () => {
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={[]}
        {...sectionProps([])}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Upcoming Meetings" }),
    ).toBeVisible();
  });

  it("shows empty state message when meetings list is empty", () => {
    render(
      <MeetingsSection
        title="Past Meetings"
        meetings={[]}
        {...sectionProps([])}
      />,
    );
    expect(screen.getByText("No meetings found.")).toBeVisible();
  });

  it("does not render a table when meetings list is empty", () => {
    render(
      <MeetingsSection
        title="Past Meetings"
        meetings={[]}
        {...sectionProps([])}
      />,
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders a table with column headers when meetings exist", () => {
    const meetings = [makeRow()];
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
      />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Date" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Member of Congress" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Staff Contact" }),
    ).toBeInTheDocument();
  });

  it("hides the Member of Congress column when showRepColumn is false", () => {
    const meetings = [makeRow()];
    render(
      <MeetingsSection
        title="Future Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
        showRepColumn={false}
      />,
    );
    expect(
      screen.queryByRole("columnheader", { name: "Member of Congress" }),
    ).not.toBeInTheDocument();
    // Other columns remain
    expect(
      screen.getByRole("columnheader", { name: "Date" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Staff Contact" }),
    ).toBeInTheDocument();
  });

  it("renders a row for each meeting", () => {
    const meetings = [
      makeRow({ id: "m1", representative_name: "Alice" }),
      makeRow({ id: "m2", representative_name: "Bob" }),
    ];
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
      />,
    );
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("displays formatted date in the date column", () => {
    const meetings = [
      makeRow({ meeting_date: "2099-06-01", meeting_time: null }),
    ];
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
      />,
    );
    expect(screen.getByText("Jun 1, 2099")).toBeInTheDocument();
  });

  it("displays time text in the time column when set", () => {
    const meetings = [
      makeRow({ meeting_date: "2099-06-01", meeting_time: "14:00" }),
    ];
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
      />,
    );
    expect(screen.getByText(/2:00 PM/)).toBeInTheDocument();
  });

  it("renders a Time column header", () => {
    const meetings = [makeRow()];
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: "Time" }),
    ).toBeInTheDocument();
  });

  it("shows em dash for null optional fields in upcoming meetings", () => {
    const meetings = [
      makeRow({ primary_team_name: null, scheduling_lead_name: null }),
    ];
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
      />,
    );
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("does not show Follow-up column in upcoming meetings", () => {
    const meetings = [makeRow({ follow_up_date: "2099-06-15" })];
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
      />,
    );
    expect(
      screen.queryByRole("columnheader", { name: "Follow-up" }),
    ).not.toBeInTheDocument();
  });

  it("shows Follow-up column in past meetings", () => {
    const meetings = [makeRow({ meeting_date: "2020-01-01" })];
    render(
      <MeetingsSection
        title="Past Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
        isPast
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: "Follow-up" }),
    ).toBeInTheDocument();
  });

  it("shows check icon when follow_up_date is set in past meetings", () => {
    const meetings = [
      makeRow({ meeting_date: "2020-01-01", follow_up_date: "2020-02-01" }),
    ];
    render(
      <MeetingsSection
        title="Past Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
        isPast
      />,
    );
    expect(screen.getByLabelText("Follow-up sent")).toBeInTheDocument();
  });

  it("shows blank follow-up cell when follow_up_date is null in past meetings", () => {
    const meetings = [
      makeRow({ meeting_date: "2020-01-01", follow_up_date: null }),
    ];
    render(
      <MeetingsSection
        title="Past Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
        isPast
      />,
    );
    expect(screen.queryByLabelText("Follow-up sent")).not.toBeInTheDocument();
  });

  it("shows Show more button when more meetings are available", () => {
    const meetings = [makeRow()];
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={meetings}
        {...sectionProps(meetings, { totalCount: 30 })}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Show more/ }),
    ).toBeInTheDocument();
  });

  it("does not show Show more button when all meetings are loaded", () => {
    const meetings = [makeRow()];
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={meetings}
        {...sectionProps(meetings)}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Show more/ }),
    ).not.toBeInTheDocument();
  });

  it("shows loading text on Show more button while loading", () => {
    const meetings = [makeRow()];
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={meetings}
        totalCount={30}
        onShowMore={vi.fn()}
        disableLoadMore
      />,
    );
    expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
  });
});

describe("MeetingRow staff contact cell", () => {
  it("shows 'Representative' when no contact and rep is a house member", () => {
    render(
      <table>
        <tbody>
          <MeetingRowComponent
            meeting={makeRow({
              congressional_contact_id: null,
              representative_district: 9,
            })}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText("Representative")).toBeInTheDocument();
  });

  it("shows 'Senator' when no contact and rep is a senator", () => {
    render(
      <table>
        <tbody>
          <MeetingRowComponent
            meeting={makeRow({
              congressional_contact_id: null,
              representative_district: null,
            })}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText("Senator")).toBeInTheDocument();
  });

  it("shows the contact name when a contact is set", () => {
    render(
      <table>
        <tbody>
          <MeetingRowComponent
            meeting={makeRow({
              congressional_contact_id: "contact-1",
              congressional_contact_name: "Alice Staffer",
            })}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText("Alice Staffer")).toBeInTheDocument();
    expect(screen.queryByText("Representative")).not.toBeInTheDocument();
  });
});

describe("MeetingRow showRepColumn", () => {
  it("omits the representative cell when showRepColumn is false", () => {
    render(
      <table>
        <tbody>
          <MeetingRowComponent
            showRepColumn={false}
            meeting={makeRow({ representative_name: "Jane Rep" })}
          />
        </tbody>
      </table>,
    );
    expect(screen.queryByText(/Jane Rep/)).not.toBeInTheDocument();
  });

  it("includes the representative cell by default", () => {
    render(
      <table>
        <tbody>
          <MeetingRowComponent
            meeting={makeRow({ representative_name: "Jane Rep" })}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText(/Jane Rep/)).toBeInTheDocument();
  });
});
