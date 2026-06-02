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
