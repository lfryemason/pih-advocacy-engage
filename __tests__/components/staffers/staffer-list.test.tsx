import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StafferList } from "@/components/staffers/staffer-list";
import { makeStaffer } from "../../mocks/supabase";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("StafferList", () => {
  it("renders only the add row when there are no staffers", () => {
    render(
      <StafferList
        representativeId="rep-1"
        orgId="pihe"
        staffers={[]}
        canDelete={false}
      />,
    );
    expect(screen.getByRole("button", { name: "Staffer" })).toBeInTheDocument();
  });

  it("renders staffer rows plus the add row", () => {
    const staffers = [
      makeStaffer({ id: "1", first_name: "Sam", last_name: "Jones" }),
      makeStaffer({
        id: "2",
        first_name: "Avery",
        last_name: "Kim",
        title: null,
        pronouns: null,
        email: null,
        notes: null,
      }),
    ];
    render(
      <StafferList
        representativeId="rep-1"
        orgId="pihe"
        staffers={staffers}
        canDelete={false}
      />,
    );
    expect(screen.getByText("Sam Jones")).toBeInTheDocument();
    expect(screen.getByText("Avery Kim")).toBeInTheDocument();
  });

  it("hides the delete button when canDelete is false", () => {
    render(
      <StafferList
        representativeId="rep-1"
        orgId="pihe"
        staffers={[makeStaffer()]}
        canDelete={false}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("shows the delete button when canDelete is true", () => {
    render(
      <StafferList
        representativeId="rep-1"
        orgId="pihe"
        staffers={[makeStaffer()]}
        canDelete
      />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
