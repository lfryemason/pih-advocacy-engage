import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddTeammateDialog } from "@/components/teams/add-teammate-dialog";
import { createClient } from "@/lib/supabase/client";

// The dialog no longer writes anything itself — it reports the collected fields
// to the parent via `onStage`, which stages them until the team is saved. The
// Supabase client is only used to prefill an existing placeholder's profile.
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

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

describe("AddTeammateDialog (add)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the dialog when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<AddTeammateDialog onStage={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /create new user/i }));
    expect(
      screen.getByRole("dialog", { name: "Add teammate" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText("Team Role")).toBeInTheDocument();
  });

  it("requires a first or last name", async () => {
    const onStage = vi.fn();
    const user = userEvent.setup();
    render(<AddTeammateDialog onStage={onStage} />);

    await user.click(screen.getByRole("button", { name: /create new user/i }));
    await user.type(screen.getByLabelText(/Email/), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Add teammate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A first or last name is required.",
    );
    expect(onStage).not.toHaveBeenCalled();
  });

  it("stages the teammate and closes on submit", async () => {
    const onStage = vi.fn();
    const user = userEvent.setup();
    render(<AddTeammateDialog onStage={onStage} />);

    await user.click(screen.getByRole("button", { name: /create new user/i }));
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
      expect(onStage).toHaveBeenCalledWith({
        email: "new@example.com",
        role: "advocacy_lead",
        fields: {
          firstName: "Jordan",
          lastName: "Rivera",
          pronouns: "",
          state: "WA",
          district: "",
        },
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("AddTeammateDialog (edit committed placeholder)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefills from the profile, disables email, and stages the fields", async () => {
    mockProfileFetch({
      email: "pending@example.com",
      first_name: "Sam",
      last_name: "Lee",
      pronouns: "they/them",
      state: "WA",
      congressional_district: null,
    });
    const onStage = vi.fn();
    const user = userEvent.setup();
    render(<AddTeammateDialog loadUserId="user-9" onStage={onStage} />);

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
      expect(onStage).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: {
            firstName: "Samuel",
            lastName: "Lee",
            pronouns: "they/them",
            state: "WA",
            district: "",
          },
        }),
      );
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
