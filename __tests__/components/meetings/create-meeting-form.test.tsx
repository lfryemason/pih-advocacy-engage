import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { CreateMeetingForm } from "@/components/meetings/create/create-meeting-form";
import { CreateMeetingValues, LinkFormEntry } from "@/lib/meetings/types";
import { server } from "../../mocks/supabase";

const SUPABASE_URL = "http://localhost";

function stubEmptyEndpoints() {
  server.use(
    http.get(`${SUPABASE_URL}/rest/v1/representatives`, () =>
      HttpResponse.json([]),
    ),
    http.get(`${SUPABASE_URL}/rest/v1/staffers`, () => HttpResponse.json([])),
    http.get(`${SUPABASE_URL}/rest/v1/teams`, () => HttpResponse.json([])),
    http.get(`${SUPABASE_URL}/rest/v1/profiles`, () =>
      HttpResponse.json(null, { status: 406 }),
    ),
    http.get(`${SUPABASE_URL}/rest/v1/team_memberships`, () =>
      HttpResponse.json([]),
    ),
  );
}

function renderForm(
  onSubmit: (
    values: CreateMeetingValues,
    links: LinkFormEntry[],
    primaryTeamName: string | null,
  ) => Promise<void> = vi.fn().mockResolvedValue(undefined),
  onCancel = vi.fn(),
) {
  render(<CreateMeetingForm onSubmit={onSubmit} onCancel={onCancel} />);
}

async function openRepComboboxAndSelect(
  user: ReturnType<typeof userEvent.setup>,
  namePattern: RegExp,
) {
  await user.click(screen.getByLabelText("Member of Congress"));
  await user.click(await screen.findByRole("option", { name: namePattern }));
}

describe("CreateMeetingForm — validation", () => {
  beforeEach(() => stubEmptyEndpoints());

  it("shows error when date is missing", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Add meeting" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Meeting date is required",
    );
  });

  it("shows error when representative is missing", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText("Date"), "2099-06-01");
    await user.click(screen.getByRole("button", { name: "Add meeting" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Member of Congress is required",
    );
  });

  it("shows error when notes exceed 255 characters", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/representatives`, () =>
        HttpResponse.json([
          {
            id: "r1",
            official_full_name: "Jane Rep",
            state: "WA",
            district: 9,
          },
        ]),
      ),
      http.get(`${SUPABASE_URL}/rest/v1/staffers`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/teams`, () => HttpResponse.json([])),
    );
    renderForm();

    await user.type(screen.getByLabelText("Date"), "2099-06-01");
    await openRepComboboxAndSelect(user, /Jane Rep/);

    fireEvent.change(screen.getByLabelText(/Notes/i), {
      target: { value: "a".repeat(256) },
    });

    await user.click(screen.getByRole("button", { name: "Add meeting" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Notes must be 255 characters",
    );
  });

  it("calls onSubmit with valid values when form is filled correctly", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/representatives`, () =>
        HttpResponse.json([
          {
            id: "rep-1",
            official_full_name: "Jane Rep",
            state: "WA",
            district: 9,
            in_office: true,
          },
        ]),
      ),
      http.get(`${SUPABASE_URL}/rest/v1/staffers`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/teams`, () => HttpResponse.json([])),
    );

    render(<CreateMeetingForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Date"), "2099-06-01");
    await openRepComboboxAndSelect(user, /Jane Rep/);
    await user.click(screen.getByRole("button", { name: "Add meeting" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          meeting_date: "2099-06-01",
          representative_id: "rep-1",
        }),
        [],
        null,
      );
    });
  });
});

describe("CreateMeetingForm — links", () => {
  beforeEach(() => stubEmptyEndpoints());

  it("can add a link row", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /Add link/i }));
    expect(screen.getByLabelText("Link 1 label")).toBeInTheDocument();
    expect(screen.getByLabelText("Link 1 URL")).toBeInTheDocument();
  });

  it("can remove a link row", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /Add link/i }));
    expect(screen.getByLabelText("Link 1 label")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove link 1" }));
    expect(screen.queryByLabelText("Link 1 label")).not.toBeInTheDocument();
  });

  it("allows duplicate link entries", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/representatives`, () =>
        HttpResponse.json([
          {
            id: "rep-1",
            official_full_name: "Jane Rep",
            state: "WA",
            district: 9,
            in_office: true,
          },
        ]),
      ),
      http.get(`${SUPABASE_URL}/rest/v1/staffers`, () => HttpResponse.json([])),
      http.get(`${SUPABASE_URL}/rest/v1/teams`, () => HttpResponse.json([])),
    );

    render(<CreateMeetingForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Date"), "2099-06-01");
    await openRepComboboxAndSelect(user, /Jane Rep/);

    await user.click(screen.getByRole("button", { name: /Add link/i }));
    await user.click(screen.getByRole("button", { name: /Add link/i }));

    await user.type(screen.getByLabelText("Link 1 label"), "Agenda");
    await user.type(screen.getByLabelText("Link 1 URL"), "https://example.com");
    await user.type(screen.getByLabelText("Link 2 label"), "Agenda");
    await user.type(screen.getByLabelText("Link 2 URL"), "https://example.com");

    await user.click(screen.getByRole("button", { name: "Add meeting" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.anything(),
        [
          { label: "Agenda", url: "https://example.com" },
          { label: "Agenda", url: "https://example.com" },
        ],
        null,
      );
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls onCancel when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <CreateMeetingForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
