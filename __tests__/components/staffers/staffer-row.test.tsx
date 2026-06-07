import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StafferRow } from "@/components/staffers/staffer-row";
import { makeStaffer } from "../../mocks/supabase";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// StafferRow renders a <li>; wrap in <ul> so the DOM is well-formed.
function renderRow(props: Parameters<typeof StafferRow>[0]) {
  return render(
    <ul>
      <StafferRow {...props} />
    </ul>,
  );
}

describe("StafferRow", () => {
  it("renders all fields when present", () => {
    renderRow({
      staffer: makeStaffer(),
      canDelete: false,
      orgId: "pihe",
    });
    expect(screen.getByText("Sam Jones")).toBeInTheDocument();
    expect(screen.getByText("they/them")).toBeInTheDocument();
    expect(screen.getByText("Chief of Staff")).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("renders minimal staffer with only name", () => {
    renderRow({
      staffer: makeStaffer({
        title: null,
        pronouns: null,
        email: null,
        notes: null,
      }),
      canDelete: false,
      orgId: "pihe",
    });
    expect(screen.getByText("Sam Jones")).toBeInTheDocument();
    expect(screen.queryByText("Chief of Staff")).not.toBeInTheDocument();
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });

  it("hides the delete button when canDelete is false", () => {
    renderRow({
      staffer: makeStaffer(),
      canDelete: false,
      orgId: "pihe",
    });
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("shows the delete button when canDelete is true", () => {
    renderRow({
      staffer: makeStaffer(),
      canDelete: true,
      orgId: "pihe",
    });
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("swaps to edit mode when the cog button is clicked", async () => {
    renderRow({
      staffer: makeStaffer(),
      canDelete: false,
      orgId: "pihe",
    });
    expect(screen.queryByLabelText("First name")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Edit staffer" }));
    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toHaveValue("Sam");
  });
});
