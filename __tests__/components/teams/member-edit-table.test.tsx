import { createRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemberEditTable,
  type MemberEditTableHandle,
} from "@/components/teams/member-edit-table";
import { createClient } from "@/lib/supabase/client";
import type { MembershipWithProfile } from "@/lib/teams";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/teams/placeholder-actions", () => ({
  deletePlaceholderTeammate: vi.fn(),
}));

const mockRouterRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}));

const COORDINATOR: MembershipWithProfile = {
  role: "team_coordinator",
  user_id: "user-1",
  profiles: {
    first_name: "Test",
    last_name: "Admin",
    pronouns: null,
    email: "admin@example.com",
    is_placeholder: false,
  },
};

const MEMBER: MembershipWithProfile = {
  role: "member",
  user_id: "user-2",
  profiles: {
    first_name: "Sam",
    last_name: "Patel",
    pronouns: null,
    email: "sam@example.com",
    is_placeholder: false,
  },
};

function mockSupabaseClient({
  deleteError = null,
  rpcError = null,
}: {
  deleteError?: Error | null;
  rpcError?: Error | null;
} = {}) {
  // The component chains three .eq() calls after .delete() (team_id, user_id,
  // role); only the last one resolves.
  const eq3 = vi.fn().mockResolvedValue({ error: deleteError });
  const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const deleteFn = vi.fn().mockReturnValue({ eq: eq1 });
  const client = {
    from: vi.fn().mockReturnValue({ delete: deleteFn }),
    rpc: vi.fn().mockResolvedValue({ error: rpcError }),
  };
  return { client, deleteFn, eq1, eq2, eq3 };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MemberEditTable — removal staging", () => {
  it("marks a member pending removal without calling supabase", async () => {
    const { client } = mockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    render(
      <MemberEditTable
        memberships={[COORDINATOR, MEMBER]}
        teamId="team-1"
        teamSlug="my-team"
        currentRole={null}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Remove Test Admin/ }),
    );

    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Remove Test Admin/ }),
    ).not.toBeInTheDocument();
    expect(client.from).not.toHaveBeenCalled();
    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });

  it("Undo restores the Remove button and clears the pending state", async () => {
    vi.mocked(createClient).mockReturnValue(
      mockSupabaseClient().client as unknown as ReturnType<typeof createClient>,
    );
    render(
      <MemberEditTable
        memberships={[COORDINATOR]}
        teamId="team-1"
        teamSlug="my-team"
        currentRole={null}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Remove Test Admin/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(
      screen.getByRole("button", { name: /Remove Test Admin/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
  });
});

describe("MemberEditTable — role change staging", () => {
  it("updates the dropdown value locally without calling supabase", async () => {
    const { client } = mockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    render(
      <MemberEditTable
        memberships={[COORDINATOR]}
        teamId="team-1"
        teamSlug="my-team"
        currentRole={null}
      />,
    );

    const roleSelect = screen.getByRole("combobox");
    await userEvent.selectOptions(roleSelect, "member");

    expect(roleSelect).toHaveValue("member");
    expect(client.rpc).not.toHaveBeenCalled();
  });
});

describe("MemberEditTable — commitPendingChanges", () => {
  it("resolves true and does not touch supabase when nothing is pending", async () => {
    const ref = createRef<MemberEditTableHandle>();
    render(
      <MemberEditTable
        ref={ref}
        memberships={[COORDINATOR]}
        teamId="team-1"
        teamSlug="my-team"
        currentRole={null}
      />,
    );

    await expect(ref.current!.commitPendingChanges()).resolves.toBe(true);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("deletes a staged removal and refreshes on success", async () => {
    const { client, deleteFn, eq1, eq2, eq3 } = mockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    const ref = createRef<MemberEditTableHandle>();
    render(
      <MemberEditTable
        ref={ref}
        memberships={[COORDINATOR]}
        teamId="team-1"
        teamSlug="my-team"
        currentRole={null}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Remove Test Admin/ }),
    );

    await expect(ref.current!.commitPendingChanges()).resolves.toBe(true);

    expect(client.from).toHaveBeenCalledWith("team_memberships");
    expect(deleteFn).toHaveBeenCalled();
    expect(eq1).toHaveBeenCalledWith("team_id", "team-1");
    expect(eq2).toHaveBeenCalledWith("user_id", "user-1");
    expect(eq3).toHaveBeenCalledWith("role", "team_coordinator");
    expect(mockRouterRefresh).toHaveBeenCalled();
  });

  it("calls change_member_role for a staged role change", async () => {
    const { client } = mockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    const ref = createRef<MemberEditTableHandle>();
    render(
      <MemberEditTable
        ref={ref}
        memberships={[COORDINATOR]}
        teamId="team-1"
        teamSlug="my-team"
        currentRole={null}
      />,
    );

    await userEvent.selectOptions(screen.getByRole("combobox"), "member");
    await expect(ref.current!.commitPendingChanges()).resolves.toBe(true);

    expect(client.rpc).toHaveBeenCalledWith("change_member_role", {
      p_team_id: "team-1",
      p_user_id: "user-1",
      p_old_role: "team_coordinator",
      p_new_role: "member",
    });
    expect(mockRouterRefresh).toHaveBeenCalled();
  });

  it("surfaces an error and keeps the change pending for retry", async () => {
    const { client } = mockSupabaseClient({ deleteError: new Error("boom") });
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    const ref = createRef<MemberEditTableHandle>();
    render(
      <MemberEditTable
        ref={ref}
        memberships={[COORDINATOR]}
        teamId="team-1"
        teamSlug="my-team"
        currentRole={null}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Remove Test Admin/ }),
    );
    await expect(ref.current!.commitPendingChanges()).resolves.toBe(false);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("boom");
    });
    // The removal is still pending — Undo is still offered.
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(mockRouterRefresh).not.toHaveBeenCalled();
  });
});
