import { describe, it, expect } from "vitest";
import { validatePlaceholderFields } from "@/lib/teams/placeholder-validate";

describe("validatePlaceholderFields", () => {
  it("requires an email", () => {
    expect(validatePlaceholderFields("", "Jane", "", "member")).toBe(
      "Email is required.",
    );
  });

  it("rejects malformed emails", () => {
    expect(
      validatePlaceholderFields("not-an-email", "Jane", "", "member"),
    ).toBe("Enter a valid email address.");
  });

  it("requires a first or last name", () => {
    expect(validatePlaceholderFields("a@b.co", "", "  ", "member")).toBe(
      "A first or last name is required.",
    );
  });

  it("rejects unknown roles", () => {
    expect(validatePlaceholderFields("a@b.co", "Jane", "", "owner")).toBe(
      "Invalid team role.",
    );
  });

  it("accepts a valid placeholder", () => {
    expect(validatePlaceholderFields("a@b.co", "", "Doe", "coach")).toBeNull();
  });
});
