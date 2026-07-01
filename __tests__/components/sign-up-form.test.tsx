import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "@/components/sign-up-form";
import { signUpOrClaim } from "@/lib/auth/sign-up-actions";

// The form submits through the signUpOrClaim server action (which wraps
// supabase.auth.signUp and the placeholder claim flow). Mock the action —
// its module pulls in the server-only admin client.
vi.mock("@/lib/auth/sign-up-actions", () => ({
  signUpOrClaim: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignUp = vi.mocked(signUpOrClaim);

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText(/Access Code/), "test-code");
  await userEvent.type(screen.getByLabelText(/First Name/), "Alice");
  await userEvent.type(screen.getByLabelText(/Last Name/), "Smith");
  await userEvent.type(screen.getByLabelText(/Email/), "alice@example.com");
  await userEvent.type(screen.getByLabelText(/^Password/), "Password123");
  await userEvent.type(screen.getByLabelText(/Repeat Password/), "Password123");
}

describe("SignUpForm", () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockSignUp.mockResolvedValue({ ok: true });
    mockPush.mockReset();
  });

  it("renders all profile, credential, and location fields", () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText(/Access Code/)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
    expect(screen.getByLabelText("Pronouns")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Repeat Password/)).toBeInTheDocument();
    expect(screen.getByLabelText("State")).toBeInTheDocument();
    expect(screen.getByLabelText("Congressional District")).toBeInTheDocument();
  });

  it("requires first and last name but not pronouns", () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText(/First Name/)).toBeRequired();
    expect(screen.getByLabelText(/Last Name/)).toBeRequired();
    expect(screen.getByLabelText("Pronouns")).not.toBeRequired();
  });

  it("renders asterisks on the required field labels only", () => {
    const { container } = render(<SignUpForm />);
    const markers = container.querySelectorAll(".text-destructive");
    expect(markers).toHaveLength(6);
    expect(screen.getByLabelText("Pronouns")).toBeInTheDocument();
    expect(screen.getByLabelText("State")).toBeInTheDocument();
    expect(screen.getByLabelText("Congressional District")).toBeInTheDocument();
  });

  it("district dropdown is disabled until a state is selected", async () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText("Congressional District")).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText("State"), "PA");
    expect(screen.getByLabelText("Congressional District")).toBeEnabled();
  });

  it("district resets when the state changes", async () => {
    render(<SignUpForm />);
    await userEvent.selectOptions(screen.getByLabelText("State"), "PA");
    await userEvent.selectOptions(
      screen.getByLabelText("Congressional District"),
      "5",
    );
    expect(screen.getByLabelText("Congressional District")).toHaveValue("5");
    await userEvent.selectOptions(screen.getByLabelText("State"), "MA");
    expect(screen.getByLabelText("Congressional District")).toHaveValue("");
  });

  it("shows an error when passwords do not match", async () => {
    render(<SignUpForm />);
    await userEvent.type(screen.getByLabelText(/Access Code/), "test-code");
    await userEvent.type(screen.getByLabelText(/First Name/), "Alice");
    await userEvent.type(screen.getByLabelText(/Last Name/), "Smith");
    await userEvent.type(screen.getByLabelText(/Email/), "alice@example.com");
    await userEvent.type(screen.getByLabelText(/^Password/), "Password123");
    await userEvent.type(
      screen.getByLabelText(/Repeat Password/),
      "Different123",
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("rejects a password that doesn't meet the policy before submitting", async () => {
    render(<SignUpForm />);
    await userEvent.type(screen.getByLabelText(/Access Code/), "test-code");
    await userEvent.type(screen.getByLabelText(/First Name/), "Alice");
    await userEvent.type(screen.getByLabelText(/Last Name/), "Smith");
    await userEvent.type(screen.getByLabelText(/Email/), "alice@example.com");
    // All lowercase + digits: fails the uppercase requirement.
    await userEvent.type(screen.getByLabelText(/^Password/), "password123");
    await userEvent.type(
      screen.getByLabelText(/Repeat Password/),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(
      screen.getByText("Password must include an uppercase letter."),
    ).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("submits name, pronouns, and location as signup metadata", async () => {
    render(<SignUpForm />);
    await fillRequiredFields();
    await userEvent.type(screen.getByLabelText("Pronouns"), "she/her");
    await userEvent.selectOptions(screen.getByLabelText("State"), "PA");
    await userEvent.selectOptions(
      screen.getByLabelText("Congressional District"),
      "5",
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "alice@example.com",
        password: "Password123",
        accessCode: "test-code",
        firstName: "Alice",
        lastName: "Smith",
        pronouns: "she/her",
        state: "PA",
        district: "5",
      });
    });
    expect(mockPush).toHaveBeenCalledWith("/auth/sign-up-success");
  });

  it("sends an empty district when no district is selected", async () => {
    render(<SignUpForm />);
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          accessCode: "test-code",
          pronouns: "",
          state: "",
          district: "",
        }),
      );
    });
  });

  it("shows an error and does not redirect when signup fails", async () => {
    mockSignUp.mockResolvedValue({ ok: false, error: "Email already in use" });
    render(<SignUpForm />);
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
