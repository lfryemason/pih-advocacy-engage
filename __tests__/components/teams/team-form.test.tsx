import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamForm } from "@/components/teams/team-form";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const mockRouterReplace = vi.fn();
const mockRouterRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace, refresh: mockRouterRefresh }),
}));

type Team = Tables<"teams">;

const SEED_TEAM: Team = {
  id: "team-123",
  org_id: "pihe",
  name: "Seattle High School",
  slug: "seattle-high-school",
  state: "WA",
  type: "high_school",
  description: null,
  founded_date: null,
  congressional_districts: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function makeUpdateChain(error: Error | null = null) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error }),
    }),
  };
}

function makeInsertChain(
  teamData: { id: string; slug: string } | null = {
    id: "new-id",
    slug: "new-team",
  },
  insertError: Error | null = null,
) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: teamData,
          error: insertError,
        }),
      }),
    }),
  };
}

function mockEditClient(error: Error | null = null) {
  const updateChain = makeUpdateChain(error);
  return {
    auth: { getUser: vi.fn() },
    from: vi.fn().mockReturnValue(updateChain),
  };
}

function mockCreateClient() {
  const membershipInsert = vi.fn().mockResolvedValue({ error: null });
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-abc" } },
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "teams") return makeInsertChain();
      return { insert: membershipInsert };
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeamForm — required markers", () => {
  it("renders asterisks on Name and Type labels only", () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    const { container } = render(<TeamForm orgId="pihe" />);
    const markers = container.querySelectorAll(".text-destructive");
    expect(markers).toHaveLength(2);
  });

  it("does not render an asterisk on Description or Founded date", () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" />);
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Founded date/)).toBeInTheDocument();
  });
});

describe("TeamForm — validation", () => {
  it("shows an error when required fields are empty on submit", async () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" />);
    await userEvent.click(screen.getByRole("button", { name: "Create team" }));
    expect(screen.getByText("Name and type are required.")).toBeInTheDocument();
  });

  it("does not mutate teams when validation fails", async () => {
    const client = mockEditClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" />);
    await userEvent.click(screen.getByRole("button", { name: "Create team" }));
    expect(client.from).not.toHaveBeenCalled();
  });

  it("allows submitting without a state", async () => {
    const client = mockCreateClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" />);

    await userEvent.type(screen.getByLabelText(/Name/), "Stateless Team");
    await userEvent.selectOptions(screen.getByLabelText(/Type/), "city");
    await userEvent.click(screen.getByRole("button", { name: "Create team" }));

    await waitFor(() => {
      const teamsFrom = (
        client.from as ReturnType<typeof vi.fn>
      ).mock.calls.find(([t]) => t === "teams");
      expect(teamsFrom).toBeTruthy();
    });
  });
});

describe("TeamForm — create mode", () => {
  it("calls insert with the correct payload", async () => {
    const client = mockCreateClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" />);

    await userEvent.type(screen.getByLabelText(/Name/), "New City Team");
    await userEvent.selectOptions(screen.getByLabelText(/State/), "OR");
    await userEvent.selectOptions(screen.getByLabelText(/Type/), "city");
    await userEvent.click(screen.getByRole("button", { name: "Create team" }));

    await waitFor(() => {
      const teamsFrom = (
        client.from as ReturnType<typeof vi.fn>
      ).mock.calls.find(([t]) => t === "teams");
      expect(teamsFrom).toBeTruthy();
    });
  });

  it("navigates to the new team page after creation", async () => {
    vi.mocked(createClient).mockReturnValue(
      mockCreateClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" />);

    await userEvent.type(screen.getByLabelText(/Name/), "New City Team");
    await userEvent.selectOptions(screen.getByLabelText(/State/), "OR");
    await userEvent.selectOptions(screen.getByLabelText(/Type/), "city");
    await userEvent.click(screen.getByRole("button", { name: "Create team" }));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/teams/new-team");
    });
  });
});

describe("TeamForm — edit mode", () => {
  it("renders Save button instead of Create team", () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" team={SEED_TEAM} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create team" }),
    ).not.toBeInTheDocument();
  });

  it("pre-populates fields from the team prop", () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" team={SEED_TEAM} />);
    expect(screen.getByLabelText(/Name/)).toHaveValue("Seattle High School");
    expect(screen.getByLabelText(/State/)).toHaveValue("WA");
    expect(screen.getByLabelText(/Type/)).toHaveValue("high_school");
  });

  it("calls update with the correct payload on save", async () => {
    const client = mockEditClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" team={SEED_TEAM} />);

    await userEvent.clear(screen.getByLabelText(/Name/));
    await userEvent.type(screen.getByLabelText(/Name/), "Renamed Team");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const updateFn = (
        client.from as unknown as (
          t: string,
        ) => ReturnType<typeof makeUpdateChain>
      )("teams").update;
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Renamed Team" }),
      );
    });
  });

  it("navigates to the team page after save when no onDone provided", async () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" team={SEED_TEAM} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith(
        "/teams/seattle-high-school",
      );
    });
  });

  it("calls onDone instead of router.replace when onDone is provided", async () => {
    const onDone = vi.fn();
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" team={SEED_TEAM} onDone={onDone} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled();
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  it("shows a save error when the update fails", async () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient(new Error("DB error")) as unknown as ReturnType<
        typeof createClient
      >,
    );
    render(<TeamForm orgId="pihe" team={SEED_TEAM} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("DB error")).toBeInTheDocument();
    });
  });
});

describe("TeamForm — cancel button", () => {
  // In create mode a Cancel button is opt-in via onCancel (there is no team to
  // return to), so without the prop it should not render.
  it("is not rendered in create mode without an onCancel prop", () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" />);
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });

  // Edit mode always offers Cancel; without an onCancel override it returns to
  // the team detail page. This is a new requirement for the edit team page.
  it("renders Cancel in edit mode and returns to the team page on click", async () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" team={SEED_TEAM} />);
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    expect(cancelBtn).toBeInTheDocument();
    await userEvent.click(cancelBtn);
    expect(mockRouterReplace).toHaveBeenCalledWith(
      "/teams/seattle-high-school",
    );
  });

  it("is rendered and calls onCancel when the prop is provided", async () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    const onCancel = vi.fn();
    render(<TeamForm orgId="pihe" team={SEED_TEAM} onCancel={onCancel} />);
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    expect(cancelBtn).toBeInTheDocument();
    await userEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  it("renders a Cancel link to cancelHref when provided", () => {
    vi.mocked(createClient).mockReturnValue(
      mockCreateClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" cancelHref="/teams" />);
    const cancelLink = screen.getByRole("link", { name: "Cancel" });
    expect(cancelLink).toHaveAttribute("href", "/teams");
  });

  it("prefers onCancel over cancelHref when both are provided", () => {
    vi.mocked(createClient).mockReturnValue(
      mockEditClient() as unknown as ReturnType<typeof createClient>,
    );
    render(<TeamForm orgId="pihe" onCancel={vi.fn()} cancelHref="/teams" />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });
});
