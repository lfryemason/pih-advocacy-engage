import { describe, it, expect } from "vitest";
import {
  EMPTY_LOCATION,
  isLocationEmpty,
  parseMeetingLocation,
} from "@/lib/meetings/types";

describe("parseMeetingLocation", () => {
  it("returns null for null, undefined, and non-objects", () => {
    expect(parseMeetingLocation(null)).toBeNull();
    expect(parseMeetingLocation(undefined)).toBeNull();
    expect(parseMeetingLocation("Hart 509")).toBeNull();
  });

  it("fills in defaults for an empty object", () => {
    expect(parseMeetingLocation({})).toEqual(EMPTY_LOCATION);
  });

  it("preserves a fully-populated location", () => {
    const raw = {
      isVirtual: false,
      city: "Washington",
      state: "DC",
      building: "Hart",
      room: "509",
    };
    expect(parseMeetingLocation(raw)).toEqual(raw);
  });

  it("only treats a strict boolean true as virtual", () => {
    expect(parseMeetingLocation({ isVirtual: true })?.isVirtual).toBe(true);
    expect(parseMeetingLocation({ isVirtual: "true" })?.isVirtual).toBe(false);
  });

  it("coerces non-string fields to empty strings", () => {
    expect(parseMeetingLocation({ city: 123, building: "Hart" })).toEqual({
      ...EMPTY_LOCATION,
      building: "Hart",
    });
  });
});

describe("isLocationEmpty", () => {
  it("is true for a blank in-person location", () => {
    expect(isLocationEmpty(EMPTY_LOCATION)).toBe(true);
  });

  it("treats whitespace-only fields as empty", () => {
    expect(
      isLocationEmpty({ ...EMPTY_LOCATION, building: "   ", city: " " }),
    ).toBe(true);
  });

  it("is false when the meeting is virtual", () => {
    expect(isLocationEmpty({ ...EMPTY_LOCATION, isVirtual: true })).toBe(false);
  });

  it("is false when any address field is set", () => {
    expect(isLocationEmpty({ ...EMPTY_LOCATION, building: "Hart" })).toBe(
      false,
    );
    expect(isLocationEmpty({ ...EMPTY_LOCATION, room: "509" })).toBe(false);
  });
});
