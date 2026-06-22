import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetingDetailView } from "@/components/meetings/meeting-detail-view";
import type { MeetingDetail } from "@/lib/meetings/types";

function makeMeeting(overrides: Partial<MeetingDetail> = {}): MeetingDetail {
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
    scheduling_lead_name: null,
    follow_up_date: null,
    champion_score: null,
    notes: null,
    location: null,
    links: [],
    delegation_members: [],
    represented_teams: [],
    ...overrides,
  };
}

describe("MeetingDetailView — Edit Meeting button", () => {
  it("renders the Edit Meeting button", () => {
    render(<MeetingDetailView meeting={makeMeeting()} onEdit={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /Edit Meeting/i }),
    ).toBeInTheDocument();
  });

  it("calls onEdit when Edit Meeting is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<MeetingDetailView meeting={makeMeeting()} onEdit={onEdit} />);
    await user.click(screen.getByRole("button", { name: /Edit Meeting/i }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});

describe("MeetingDetailView — time", () => {
  it("renders meeting time with timezone abbreviation", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({
          meeting_time: "14:30",
          meeting_timezone: "America/New_York",
        })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText(/2:30 PM/)).toBeInTheDocument();
  });

  it("omits time section when meeting_time is null", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ meeting_time: null })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.queryByText(/AM|PM/)).not.toBeInTheDocument();
  });
});

describe("MeetingDetailView — location", () => {
  it("renders location when set", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ location: "Capitol Hill, Room 101" })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Capitol Hill, Room 101")).toBeInTheDocument();
  });

  it("omits location section when null", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ location: null })}
        onEdit={vi.fn()}
      />,
    );
    expect(
      screen.queryByText(/Location/i, { selector: "p" }),
    ).not.toBeInTheDocument();
  });
});

describe("MeetingDetailView — notes with accent bar", () => {
  it("renders notes text", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ notes: "Key talking points here." })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Key talking points here.")).toBeInTheDocument();
  });

  it("renders notes inside a left-accent-bar container", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ notes: "Accent bar notes" })}
        onEdit={vi.fn()}
      />,
    );
    const notesEl = screen.getByText("Accent bar notes");
    expect(notesEl.closest("div")).toHaveClass("border-l-4");
  });

  it("omits notes section when null", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ notes: null })}
        onEdit={vi.fn()}
      />,
    );
    expect(
      screen.queryByText(/Notes/i, { selector: "p" }),
    ).not.toBeInTheDocument();
  });
});

describe("MeetingDetailView — links", () => {
  it("renders each link as a clickable anchor with label", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({
          links: [
            { label: "Agenda", url: "https://example.com/agenda" },
            { label: "Briefing", url: "https://example.com/brief" },
          ],
        })}
        onEdit={vi.fn()}
      />,
    );
    const agendaLink = screen.getByRole("link", { name: /Agenda/i });
    expect(agendaLink).toHaveAttribute("href", "https://example.com/agenda");
    expect(agendaLink).toHaveAttribute("target", "_blank");

    const briefingLink = screen.getByRole("link", { name: /Briefing/i });
    expect(briefingLink).toHaveAttribute("href", "https://example.com/brief");
  });

  it("omits links section when empty", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ links: [] })}
        onEdit={vi.fn()}
      />,
    );
    expect(
      screen.queryByText(/Links/i, { selector: "p" }),
    ).not.toBeInTheDocument();
  });
});

describe("MeetingDetailView — delegation", () => {
  it("shows delegation member names and role labels", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({
          delegation_members: [
            {
              id: "dm-1",
              user_id: "u-1",
              first_name: "Alice",
              last_name: "Smith",
              display_name: "Alice Smith",
              email: "alice@example.com",
              role: "scheduling_lead",
              pronouns: null,
              team_id: null,
              team_name_snapshot: null,
            },
            {
              id: "dm-2",
              user_id: "u-2",
              first_name: "Bob",
              last_name: "Jones",
              display_name: "Bob Jones",
              email: null,
              role: "attendee",
              pronouns: null,
              team_id: null,
              team_name_snapshot: null,
            },
          ],
        })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText(/Scheduler/i)).toBeInTheDocument();
    // an attendee renders as a labeled avatar button, not visible text
    expect(
      screen.getByRole("button", { name: /Bob Jones.*Attendee/i }),
    ).toBeInTheDocument();
  });

  it("shows email for scheduling_lead when present", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({
          delegation_members: [
            {
              id: "dm-1",
              user_id: "u-1",
              first_name: "Alice",
              last_name: "Smith",
              display_name: "Alice Smith",
              email: "alice@example.com",
              role: "scheduling_lead",
              pronouns: null,
              team_id: null,
              team_name_snapshot: null,
            },
          ],
        })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
  });

  it("does not show email for attendee roles", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({
          delegation_members: [
            {
              id: "dm-1",
              user_id: "u-1",
              first_name: "Bob",
              last_name: "Jones",
              display_name: "Bob Jones",
              email: "bob@example.com",
              role: "attendee",
              pronouns: null,
              team_id: null,
              team_name_snapshot: null,
            },
          ],
        })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.queryByText(/bob@example\.com/)).not.toBeInTheDocument();
  });

  it("shows None when delegation is empty", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ delegation_members: [] })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText("None")).toBeInTheDocument();
  });
});

describe("MeetingDetailView — champion level", () => {
  it("renders champion score as '{n} – {Label}'", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ champion_score: 3 })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText(/3 – Advocate/)).toBeInTheDocument();
  });

  it("renders score 0 correctly", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ champion_score: 0 })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText(/0 – Opposed/)).toBeInTheDocument();
  });

  it("renders score 5 correctly", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ champion_score: 5 })}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText(/5 – Champion/)).toBeInTheDocument();
  });

  it("omits Champion Level section when score is null", () => {
    render(
      <MeetingDetailView
        meeting={makeMeeting({ champion_score: null })}
        onEdit={vi.fn()}
      />,
    );
    expect(
      screen.queryByText(/Champion Level/i, { selector: "p" }),
    ).not.toBeInTheDocument();
  });
});
