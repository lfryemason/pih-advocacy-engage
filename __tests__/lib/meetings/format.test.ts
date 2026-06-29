import { describe, it, expect } from "vitest";
import { formatLocation } from "@/lib/meetings/format";
import { EMPTY_LOCATION, type MeetingLocation } from "@/lib/meetings/types";

function loc(overrides: Partial<MeetingLocation> = {}): MeetingLocation {
  return { ...EMPTY_LOCATION, ...overrides };
}

describe("formatLocation", () => {
  it("renders 'Virtual' regardless of other fields", () => {
    expect(
      formatLocation(loc({ isVirtual: true, building: "Hart", city: "DC" })),
    ).toBe("Virtual");
  });

  it("combines building and room", () => {
    expect(formatLocation(loc({ building: "Hart", room: "509" }))).toBe(
      "Hart, Rm 509",
    );
  });

  it("shows building alone when there is no room", () => {
    expect(formatLocation(loc({ building: "Hart" }))).toBe("Hart");
  });

  it("shows room alone when there is no building", () => {
    expect(formatLocation(loc({ room: "509" }))).toBe("Rm 509");
  });

  it("combines city and state", () => {
    expect(formatLocation(loc({ city: "Washington", state: "DC" }))).toBe(
      "Washington, DC",
    );
  });

  it("joins the building and city/state groups with an em dash", () => {
    expect(
      formatLocation(
        loc({ building: "Hart", room: "509", city: "Washington", state: "DC" }),
      ),
    ).toBe("Hart, Rm 509 — Washington, DC");
  });

  it("returns an empty string when every in-person field is blank", () => {
    expect(formatLocation(EMPTY_LOCATION)).toBe("");
  });

  it("ignores whitespace-only fields", () => {
    expect(
      formatLocation(loc({ building: "   ", city: "  ", room: "509" })),
    ).toBe("Rm 509");
  });
});
