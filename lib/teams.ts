export const TYPE_LABELS: Record<string, string> = {
  high_school: "High School",
  university: "College/University",
  city: "City",
};

export const ROLE_LABELS: Record<string, string> = {
  team_coordinator: "Team Coordinator",
  advocacy_lead: "Advocacy Lead",
  community_building_lead: "Community Building Lead",
  fundraising_lead: "Fundraising Lead",
  coach: "Coach",
  member: "Member",
};

export const LEAD_ROLES = [
  "team_coordinator",
  "advocacy_lead",
  "community_building_lead",
  "fundraising_lead",
  "coach",
] as const;

export const LEADERSHIP_ROLES = (
  [
    "team_coordinator",
    "advocacy_lead",
    "community_building_lead",
    "fundraising_lead",
  ] as const
).map((role) => ({ role, label: ROLE_LABELS[role] }));

export const ROLE_OPTIONS = (
  [
    "member",
    "team_coordinator",
    "advocacy_lead",
    "community_building_lead",
    "fundraising_lead",
    "coach",
  ] as const
).map((role) => ({ value: role, label: ROLE_LABELS[role] }));

export type MembershipWithProfile = {
  role: string;
  user_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    pronouns: string | null;
    email: string;
  } | null;
};

export function displayName(profiles: MembershipWithProfile["profiles"]) {
  if (!profiles) return "—";
  return (
    [profiles.first_name, profiles.last_name].filter(Boolean).join(" ") || "—"
  );
}
