import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "@/components/profile-form";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockProfileUpdate = vi.fn();

const DEFAULT_PROFILE = {
  first_name: "Alice",
  last_name: "Smith",
  pronouns: "she/her",
  state: "PA",
  congressional_district: "5",
};

function makeProfileChain(
  profile: Partial<typeof DEFAULT_PROFILE> | null = DEFAULT_PROFILE,
  updateError: Error | null = null,
) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: profile, error: null }),
      }),
    }),
    update: mockProfileUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: updateError }),
    }),
  };
}

function mockClient(
  profile: Partial<typeof DEFAULT_PROFILE> | null = DEFAULT_PROFILE,
  updateError: Error | null = null,
) {
  return {
    auth: { getUser: mockGetUser },
    from: vi.fn().mockReturnValue(makeProfileChain(profile, updateError)),
  };
}

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReturnValue(
      mockClient() as unknown as ReturnType<typeof createClient>,
    );
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });
    mockProfileUpdate.mockReset();
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
    vi.mocked(createClient).mockReturnValue(
      mockClient({
        ...DEFAULT_PROFILE,
        state: "",
        congressional_district: "",
      }) as unknown as ReturnType<typeof createClient>,
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
    vi.mocked(createClient).mockReturnValue(
      mockClient({
        ...DEFAULT_PROFILE,
        state: "",
        congressional_district: "",
      }) as unknown as ReturnType<typeof createClient>,
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

  it("saves profile data on submit", async () => {
    const client = mockClient();
    vi.mocked(createClient).mockReturnValue(
      client as unknown as ReturnType<typeof createClient>,
    );
    mockProfileUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    render(<ProfileForm />);
    await waitFor(() => {
      expect(screen.getByLabelText("First Name")).toHaveValue("Alice");
    });
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(mockProfileUpdate).toHaveBeenCalledWith({
        first_name: "Alice",
        last_name: "Smith",
        pronouns: "she/her",
        state: "PA",
        congressional_district: "5",
      });
    });
  });

  it("shows success message after saving", async () => {
    mockProfileUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
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
    mockProfileUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: new Error("Network error") }),
    });
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
