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

export const LINK_CN = "text-primary-dark underline-offset-4 hover:underline";
export const SECTION_LABEL_CLASSNAME =
  "font-semibold uppercase tracking-wide text-muted-foreground";

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
