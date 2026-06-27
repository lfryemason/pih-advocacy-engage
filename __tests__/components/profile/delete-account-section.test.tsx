import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DeleteAccountSection,
  REDIRECT_DELAY_MS,
} from "@/components/profile/delete-account-section";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockRpc = vi.fn();
const mockSignOut = vi.fn();

function mockClient() {
  return { rpc: mockRpc, auth: { signOut: mockSignOut } };
}

async function openDialog() {
  await userEvent.click(screen.getByRole("button", { name: "Delete Account" }));
  return within(await screen.findByRole("dialog"));
}

describe("DeleteAccountSection", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReturnValue(
      mockClient() as unknown as ReturnType<typeof createClient>,
    );
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ error: null });
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue({ error: null });
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it("renders the danger card with the delete trigger", () => {
    render(<DeleteAccountSection />);
    expect(
      screen.getByRole("heading", { name: "Delete Account" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Account" }),
    ).toBeInTheDocument();
  });

  it("keeps the confirm button disabled until DELETE is typed exactly", async () => {
    render(<DeleteAccountSection />);
    const dialog = await openDialog();
    const confirmButton = dialog.getByRole("button", {
      name: "Delete Account",
    });

    expect(confirmButton).toBeDisabled();

    await userEvent.type(dialog.getByLabelText(/Type/), "delete");
    expect(confirmButton).toBeDisabled();

    await userEvent.clear(dialog.getByLabelText(/Type/));
    await userEvent.type(dialog.getByLabelText(/Type/), "DELETE");
    expect(confirmButton).toBeEnabled();
  });

  it("deletes, signs out, shows the confirmation, then redirects to login", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    try {
      render(<DeleteAccountSection />);
      await user.click(screen.getByRole("button", { name: "Delete Account" }));
      const dialog = within(await screen.findByRole("dialog"));
      await user.type(dialog.getByLabelText(/Type/), "DELETE");
      await user.click(dialog.getByRole("button", { name: "Delete Account" }));

      expect(
        await screen.findByText("Your account has been deleted"),
      ).toBeInTheDocument();
      expect(mockRpc).toHaveBeenCalledWith("delete_own_account");
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(REDIRECT_DELAY_MS);
      expect(mockPush).toHaveBeenCalledWith("/auth/login");
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows an error and does not sign out or redirect when the rpc fails", async () => {
    mockRpc.mockResolvedValue({ error: { message: "boom" } });
    render(<DeleteAccountSection />);
    const dialog = await openDialog();
    await userEvent.type(dialog.getByLabelText(/Type/), "DELETE");
    await userEvent.click(
      dialog.getByRole("button", { name: "Delete Account" }),
    );

    await waitFor(() => {
      expect(screen.getByText("boom")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Your account has been deleted"),
    ).not.toBeInTheDocument();
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not call the rpc when cancelled", async () => {
    render(<DeleteAccountSection />);
    const dialog = await openDialog();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
