// Whether userId belongs to a meeting's delegation, given the user ids of its
// current members. Shared by any UI that gates a meeting-scoped action (view,
// delete, etc.) behind delegation membership.
export function isDelegationMember(
  userId: string | null,
  memberUserIds: readonly string[],
): boolean {
  return userId !== null && memberUserIds.includes(userId);
}
