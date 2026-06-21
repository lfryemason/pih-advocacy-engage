import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimezoneSelect } from "@/components/meetings/create/timezone-select";

function renderSelect(value: string) {
  render(<TimezoneSelect id="tz" value={value} onChange={vi.fn()} />);
  return screen.getByRole("combobox") as HTMLSelectElement;
}

describe("TimezoneSelect", () => {
  it("maps a raw IANA zone that isn't a curated option to the right option", () => {
    // react-timezone-select keys Eastern Time under "America/Detroit", so the
    // browser's "America/New_York" must not fall back to the first option.
    const select = renderSelect("America/New_York");
    expect(select.value).toBe("America/Detroit");
    expect(select.selectedOptions[0].textContent).toMatch(/Eastern Time/);
  });

  it("keeps a value that already matches a curated option", () => {
    const select = renderSelect("America/Chicago");
    expect(select.value).toBe("America/Chicago");
  });

  it("falls back to Eastern Time when the zone can't be resolved", () => {
    const select = renderSelect("");
    expect(select.value).toBe("America/Detroit");
  });
});
