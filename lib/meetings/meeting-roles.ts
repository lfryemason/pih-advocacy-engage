import type { DelegationRole } from "@/lib/meetings/types";

export const ROLE_LABELS: Record<DelegationRole, string> = {
  scheduling_lead: "Scheduling Lead",
  attendee_talking: "Attendee (Talking)",
  attendee_listening: "Attendee (Listening)",
  pih_team_member: "PIH Team Member",
  note_taker: "Note Taker",
};

export const ROLE_COLORS: Record<DelegationRole, string> = {
  scheduling_lead: "bg-muted text-foreground",
  attendee_talking: "bg-blue-500 text-white",
  attendee_listening: "bg-violet-500 text-white",
  pih_team_member: "bg-teal-500 text-white",
  note_taker: "bg-amber-500 text-white",
};

export const MEMBER_ROLES: DelegationRole[] = (
  Object.keys(ROLE_LABELS) as DelegationRole[]
).filter((r) => r !== "scheduling_lead" && r !== "pih_team_member");

export const CHAMPION_LABELS: Record<number, string> = {
  0: "Opposed",
  1: "Neutral/Uninformed",
  2: "Supporter",
  3: "Advocate",
  4: "Leader",
  5: "Champion",
};
