import type { MeetingLocation } from "@/lib/meetings/types";

export function formatLocation(loc: MeetingLocation): string {
  if (loc.isVirtual) return "Virtual";
  const building = [loc.building, loc.room]
    .filter((p) => p && p.trim())
    .join(" - ");
  const cityState = [loc.city, loc.state]
    .filter((p) => p && p.trim())
    .join(", ");
  return [building, cityState].filter(Boolean).join(" — ");
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function initials(firstName: string, lastName: string): string {
  return ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase();
}

export const LINK_CN = "text-foreground underline underline-offset-4";
export const SECTION_LABEL_CLASSNAME =
  "font-semibold uppercase tracking-wide text-muted-foreground";
export const EMPTY_VALUE_CLASSNAME = "mt-1 text-sm text-muted-foreground/50";

export function formatTime(
  meetingDate: string,
  time: string | null,
  timezone: string,
): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  const minuteStr = m.toString().padStart(2, "0");
  let tzAbbr = "";
  try {
    const refDate = new Date(`${meetingDate}T12:00:00Z`);
    tzAbbr =
      new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "short",
      })
        .formatToParts(refDate)
        .find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {}
  return tzAbbr
    ? `${hour12}:${minuteStr} ${ampm} ${tzAbbr}`
    : `${hour12}:${minuteStr} ${ampm}`;
}
