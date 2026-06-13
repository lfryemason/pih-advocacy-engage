import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "@/components/sign-up-form";
import { createClient } from "@/lib/supabase/client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignUp = vi.fn();

function mockClient() {
  return { auth: { signUp: mockSignUp } };
}

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText(/First Name/), "Alice");
  await userEvent.type(screen.getByLabelText(/Last Name/), "Smith");
  await userEvent.type(screen.getByLabelText(/Email/), "alice@example.com");
  await userEvent.type(screen.getByLabelText(/^Password/), "password123");
  await userEvent.type(screen.getByLabelText(/Repeat Password/), "password123");
}

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReturnValue(
      mockClient() as unknown as ReturnType<typeof createClient>,
    );
    mockSignUp.mockReset();
    mockSignUp.mockResolvedValue({ error: null });
    mockPush.mockReset();
  });

  it("renders all profile, credential, and location fields", () => {
    render(<SignUpForm />);
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
    expect(markers).toHaveLength(5);
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
    await userEvent.type(screen.getByLabelText(/First Name/), "Alice");
    await userEvent.type(screen.getByLabelText(/Last Name/), "Smith");
    await userEvent.type(screen.getByLabelText(/Email/), "alice@example.com");
    await userEvent.type(screen.getByLabelText(/^Password/), "password123");
    await userEvent.type(
      screen.getByLabelText(/Repeat Password/),
      "different123",
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
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
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "alice@example.com",
          password: "password123",
          options: expect.objectContaining({
            data: {
              first_name: "Alice",
              last_name: "Smith",
              pronouns: "she/her",
              state: "PA",
              congressional_district: "5",
            },
          }),
        }),
      );
    });
    expect(mockPush).toHaveBeenCalledWith("/auth/sign-up-success");
  });

  it("sends null district when no district is selected", async () => {
    render(<SignUpForm />);
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: expect.objectContaining({
              pronouns: "",
              state: "",
              congressional_district: null,
            }),
          }),
        }),
      );
    });
  });

  it("shows an error and does not redirect when signup fails", async () => {
    mockSignUp.mockResolvedValue({ error: new Error("Email already in use") });
    render(<SignUpForm />);
    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
