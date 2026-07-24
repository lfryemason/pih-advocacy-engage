import type { DelegationRole } from "@/lib/meetings/types";

export const ROLE_LABELS: Record<DelegationRole, string> = {
  meeting_facilitator: "Meeting Facilitator",
  note_taker: "Notetaker",
  storyteller: "Storyteller",
  photographer: "Photographer",
  scheduling_lead: "Scheduler/Follow-up",
  expert: "Expert",
  attendee: "Attendee",
};

export const ROLE_COLORS: Record<DelegationRole, string> = {
  meeting_facilitator: "bg-blue-500 text-white",
  note_taker: "bg-amber-500 text-white",
  storyteller: "bg-violet-500 text-white",
  photographer: "bg-rose-500 text-white",
  scheduling_lead: "bg-indigo-500 text-white",
  expert: "bg-teal-500 text-white",
  attendee: "bg-slate-500 text-white",
};

export const DELEGATION_ROLES = Object.keys(ROLE_LABELS) as DelegationRole[];

export const MEMBER_ROLES: DelegationRole[] = (
  Object.keys(ROLE_LABELS) as DelegationRole[]
).filter((r) => r !== "scheduling_lead" && r !== "expert");

export const CHAMPION_LABELS: Record<number, string> = {
  0: "Opposed",
  1: "Neutral/Uninformed",
  2: "Supporter",
  3: "Advocate",
  4: "Leader",
  5: "Champion",
};
