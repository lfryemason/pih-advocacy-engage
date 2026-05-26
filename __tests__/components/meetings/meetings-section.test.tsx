import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MeetingsSection } from "@/components/meetings/meetings-section";
import { MeetingRow as MeetingRowComponent } from "@/components/meetings/meeting-row";
import { MeetingRow } from "@/lib/meetings/types";

function makeRow(overrides: Partial<MeetingRow> = {}): MeetingRow {
  return {
    id: "id-1",
    meeting_date: "2099-06-01",
    meeting_time: null,
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
    scheduling_lead_name: null,
    follow_up_date: null,
    champion_score: null,
    ...overrides,
  };
}

describe("MeetingsSection", () => {
  it("renders the section title as a heading", () => {
    render(<MeetingsSection title="Upcoming Meetings" meetings={[]} />);
    expect(
      screen.getByRole("heading", { name: "Upcoming Meetings" }),
    ).toBeVisible();
  });

  it("shows empty state message when meetings list is empty", () => {
    render(<MeetingsSection title="Past Meetings" meetings={[]} />);
    expect(screen.getByText("No meetings found.")).toBeVisible();
  });

  it("does not render a table when meetings list is empty", () => {
    render(<MeetingsSection title="Past Meetings" meetings={[]} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders a table with column headers when meetings exist", () => {
    render(
      <MeetingsSection title="Upcoming Meetings" meetings={[makeRow()]} />,
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

  it("renders a row for each meeting", () => {
    const meetings = [
      makeRow({ id: "m1", representative_name: "Alice" }),
      makeRow({ id: "m2", representative_name: "Bob" }),
    ];
    render(<MeetingsSection title="Upcoming Meetings" meetings={meetings} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("displays formatted meeting date in each row", () => {
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={[makeRow({ meeting_date: "2099-06-01" })]}
      />,
    );
    expect(screen.getByText("Jun 1, 2099")).toBeInTheDocument();
  });

  it("shows em dash for null optional fields", () => {
    render(
      <MeetingsSection
        title="Upcoming Meetings"
        meetings={[
          makeRow({
            primary_team_name: null,
            scheduling_lead_name: null,
            follow_up_date: null,
          }),
        ]}
      />,
    );
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("matches snapshot with meetings", () => {
    const { asFragment } = render(
      <MeetingsSection title="Upcoming Meetings" meetings={[makeRow()]} />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot empty state", () => {
    const { asFragment } = render(
      <MeetingsSection title="Past Meetings" meetings={[]} />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

describe("MeetingRow (collapsed)", () => {
  it("matches snapshot in collapsed state", () => {
    const { asFragment } = render(
      <table>
        <tbody>
          <MeetingRowComponent
            meeting={makeRow({
              meeting_date: "2099-06-01",
              representative_name: "Jane Rep",
              congressional_contact_name: "Jane Rep",
              primary_team_name: "Global Health",
              scheduling_lead_name: "Alice Lead",
              follow_up_date: "2099-06-15",
            })}
          />
        </tbody>
      </table>,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
