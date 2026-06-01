import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { CreateMeetingForm } from "@/components/meetings/create-meeting-form";
import { AddMeetingDialog } from "@/components/meetings/add-meeting-dialog";
import { server } from "../../mocks/supabase";

const SUPABASE_URL = "http://localhost";

function stubEmpty() {
  server.use(
    http.get(`${SUPABASE_URL}/rest/v1/representatives`, () =>
      HttpResponse.json([]),
    ),
    http.get(`${SUPABASE_URL}/rest/v1/staffers`, () => HttpResponse.json([])),
    http.get(`${SUPABASE_URL}/rest/v1/teams`, () => HttpResponse.json([])),
  );
}

describe("CreateMeetingForm — snapshot", () => {
  it("matches snapshot", () => {
    stubEmpty();
    const { asFragment } = render(
      <CreateMeetingForm
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        onCancel={vi.fn()}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});

describe("AddMeetingDialog — snapshot", () => {
  it("renders the trigger button", () => {
    const { asFragment } = render(<AddMeetingDialog onCreated={vi.fn()} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("opens the dialog when trigger is clicked", async () => {
    stubEmpty();
    const user = userEvent.setup();
    render(<AddMeetingDialog onCreated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Add Meeting/i }));
    expect(
      screen.getByRole("dialog", { name: "Add Meeting" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add meeting" }),
    ).toBeInTheDocument();
  });

  it("closes the dialog when cancel is clicked", async () => {
    stubEmpty();
    const user = userEvent.setup();
    render(<AddMeetingDialog onCreated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Add Meeting/i }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
