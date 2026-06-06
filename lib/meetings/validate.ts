export function validateMeetingFields(
  meetingDate: string,
  representativeId: string,
  notes: string,
): string | null {
  if (!meetingDate) return "Meeting date is required.";
  if (!representativeId) return "Member of Congress is required.";
  if (notes.trim().length > 255)
    return "Notes must be 255 characters or fewer.";
  return null;
}
