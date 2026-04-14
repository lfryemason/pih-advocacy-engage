import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "@/components/profile-form";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockClient = {
  auth: {
    getUser: mockGetUser,
    updateUser: mockUpdateUser,
  },
};

function makeUserResult(metaOverrides: Record<string, string> = {}) {
  return {
    data: {
      user: {
        email: "test@example.com",
        user_metadata: {
          first_name: "Alice",
          last_name: "Smith",
          pronouns: "she/her",
          state: "PA",
          congressional_district: "5",
          ...metaOverrides,
        },
      },
    },
  };
}

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createClient>,
    );
    mockGetUser.mockResolvedValue(makeUserResult());
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it("shows loading state initially", () => {
    mockGetUser.mockReturnValue(new Promise(() => {}));
    render(<ProfileForm />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders form fields with user data after loading", async () => {
    render(<ProfileForm />);
    await waitFor(() => {
      expect(screen.getByLabelText("First Name")).toHaveValue("Alice");
    });
    expect(screen.getByLabelText("Last Name")).toHaveValue("Smith");
    expect(screen.getByLabelText("Pronouns")).toHaveValue("she/her");
    expect(screen.getByLabelText("Email")).toHaveValue("test@example.com");
  });

  it("email field is disabled", async () => {
    render(<ProfileForm />);
    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toBeDisabled();
    });
  });

  it("district dropdown is disabled until state is selected", async () => {
    mockGetUser.mockResolvedValue(
      makeUserResult({ state: "", congressional_district: "" }),
    );
    render(<ProfileForm />);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("Congressional District")).toBeDisabled();

    await userEvent.selectOptions(screen.getByLabelText("State"), "PA");
    expect(screen.getByLabelText("Congressional District")).toBeEnabled();
  });

  it("district resets when state changes", async () => {
    render(<ProfileForm />);
    await waitFor(() => {
      expect(screen.getByLabelText("Congressional District")).toHaveValue("5");
    });
    await userEvent.selectOptions(screen.getByLabelText("State"), "MA");
    expect(screen.getByLabelText("Congressional District")).toHaveValue("");
  });

  it("at-large states show only 'At Large' district option", async () => {
    mockGetUser.mockResolvedValue(
      makeUserResult({ state: "", congressional_district: "" }),
    );
    render(<ProfileForm />);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    await userEvent.selectOptions(screen.getByLabelText("State"), "VT");
    const districtSelect = screen.getByLabelText("Congressional District");
    expect(districtSelect).toBeEnabled();
    expect(
      screen.getByRole("option", { name: "At Large" }),
    ).toBeInTheDocument();
  });

  it("calls updateUser with form data on submit", async () => {
    render(<ProfileForm />);
    await waitFor(() => {
      expect(screen.getByLabelText("First Name")).toHaveValue("Alice");
    });
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: {
          first_name: "Alice",
          last_name: "Smith",
          pronouns: "she/her",
          state: "PA",
          congressional_district: "5",
        },
      });
    });
  });

  it("shows success message after saving", async () => {
    render(<ProfileForm />);
    await waitFor(() => {
      expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(
        screen.getByText("Profile saved successfully."),
      ).toBeInTheDocument();
    });
  });

  it("shows error message when save fails", async () => {
    mockUpdateUser.mockResolvedValue({ error: new Error("Network error") });
    render(<ProfileForm />);
    await waitFor(() => {
      expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
