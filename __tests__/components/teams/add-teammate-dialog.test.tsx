import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddTeammateDialog } from "@/components/teams/add-teammate-dialog";
import {
  createPlaceholderTeammate,
  updatePlaceholderTeammate,
} from "@/lib/teams/placeholder-actions";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/teams/placeholder-actions", () => ({
  createPlaceholderTeammate: vi.fn(),
  updatePlaceholderTeammate: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const mockRouterRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}));

const mockedCreate = vi.mocked(createPlaceholderTeammate);
const mockedUpdate = vi.mocked(updatePlaceholderTeammate);
const mockedCreateClient = vi.mocked(createClient);

function mockProfileFetch(
  profile: Record<string, unknown> | null,
  error: Error | null = null,
) {
  const single = vi.fn().mockResolvedValue({ data: profile, error });
  mockedCreateClient.mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single }),
      }),
    }),
  } as unknown as ReturnType<typeof createClient>);
}

describe("AddTeammateDialog (create)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the dialog when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<AddTeammateDialog teamId="team-1" teamSlug="my-team" />);

    await user.click(screen.getByRole("button", { name: /add teammate/i }));
    expect(
      screen.getByRole("dialog", { name: "Add teammate" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText("Team Role")).toBeInTheDocument();
  });

  it("requires a first or last name", async () => {
    const user = userEvent.setup();
    render(<AddTeammateDialog teamId="team-1" teamSlug="my-team" />);

    await user.click(screen.getByRole("button", { name: /add teammate/i }));
    await user.type(screen.getByLabelText(/Email/), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Add teammate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A first or last name is required.",
    );
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("submits the placeholder and closes on success", async () => {
    mockedCreate.mockResolvedValue({ ok: true, userId: "new-user" });
    const user = userEvent.setup();
    render(<AddTeammateDialog teamId="team-1" teamSlug="my-team" />);

    await user.click(screen.getByRole("button", { name: /add teammate/i }));
    await user.type(screen.getByLabelText(/Email/), "new@example.com");
    await user.type(screen.getByLabelText("First Name"), "Jordan");
    await user.type(screen.getByLabelText("Last Name"), "Rivera");
    await user.selectOptions(screen.getByLabelText("State"), "WA");
    await user.selectOptions(
      screen.getByLabelText("Team Role"),
      "advocacy_lead",
    );
    await user.click(screen.getByRole("button", { name: "Add teammate" }));

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({
        teamId: "team-1",
        email: "new@example.com",
        firstName: "Jordan",
        lastName: "Rivera",
        pronouns: "",
        state: "WA",
        district: "",
        role: "advocacy_lead",
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockRouterRefresh).toHaveBeenCalled();
  });

  it("shows a server error via role=alert and stays open", async () => {
    mockedCreate.mockResolvedValue({
      ok: false,
      error: "Someone with this email already exists.",
    });
    const user = userEvent.setup();
    render(<AddTeammateDialog teamId="team-1" teamSlug="my-team" />);

    await user.click(screen.getByRole("button", { name: /add teammate/i }));
    await user.type(screen.getByLabelText(/Email/), "taken@example.com");
    await user.type(screen.getByLabelText("First Name"), "Jordan");
    await user.click(screen.getByRole("button", { name: "Add teammate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Someone with this email already exists.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });
});

describe("AddTeammateDialog (edit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefills from the profile, disables email, and submits an update", async () => {
    mockProfileFetch({
      email: "pending@example.com",
      first_name: "Sam",
      last_name: "Lee",
      pronouns: "they/them",
      state: "WA",
      congressional_district: null,
    });
    mockedUpdate.mockResolvedValue({ ok: true, userId: "user-9" });
    const user = userEvent.setup();
    render(
      <AddTeammateDialog
        teamId="team-1"
        teamSlug="my-team"
        editUserId="user-9"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Edit placeholder teammate" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Edit teammate" }),
    ).toBeInTheDocument();

    const emailInput = await screen.findByLabelText(/Email/);
    await waitFor(() => expect(emailInput).toHaveValue("pending@example.com"));
    expect(emailInput).toBeDisabled();
    expect(screen.getByLabelText("First Name")).toHaveValue("Sam");
    expect(screen.queryByLabelText("Team Role")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("First Name"));
    await user.type(screen.getByLabelText("First Name"), "Samuel");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledWith({
        userId: "user-9",
        teamSlug: "my-team",
        firstName: "Samuel",
        lastName: "Lee",
        pronouns: "they/them",
        state: "WA",
        district: "",
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockRouterRefresh).toHaveBeenCalled();
  });
});
