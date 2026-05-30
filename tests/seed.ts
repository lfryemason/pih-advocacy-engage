export const TEST_USER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
export const SEED_TEAM_ID = "22222222-2222-2222-2222-222222222222";
export const SEED_TEAM_NO_MEMBER_ID = "33333333-3333-3333-3333-333333333333";
export const SEED_MEETING_UPCOMING_ID = "44444444-4444-4444-4444-444444444444";
export const SEED_MEETING_PAST_ID = "55555555-5555-5555-5555-555555555555";
// Adam Smith (WA-09) — used in seed meetings. Must match SEED_REPRESENTATIVES.
export const SEED_REP_WA_BIOGUIDE = "W000002";
export const TEST_EMAIL = "playwright@example.com";
export const TEST_PASSWORD = "Playwright1!";

export const SEED_PROFILE = {
  user_id: TEST_USER_ID,
  org_id: "pihe",
  email: TEST_EMAIL,
  first_name: "Test",
  last_name: "Admin",
  pronouns: "they/them",
  state: "WA",
  congressional_district: "9",
};

export const SEED_TEAMS = [
  {
    id: SEED_TEAM_ID,
    org_id: "pihe",
    name: "Seattle High School",
    slug: "seattle-high-school",
    state: "WA",
    type: "high_school",
    description: null,
    founded_date: null,
    congressional_districts: ["9"],
  },
  {
    id: SEED_TEAM_NO_MEMBER_ID,
    org_id: "pihe",
    name: "Portland University",
    slug: "portland-university",
    state: "OR",
    type: "university",
    description: null,
    founded_date: null,
  },
];

export const SEED_TEAM_MEMBERSHIPS = [
  {
    team_id: SEED_TEAM_ID,
    user_id: TEST_USER_ID,
    org_id: "pihe",
    role: "team_lead",
  },
];

export const SEED_REPRESENTATIVES = [
  {
    bioguide_id: "W000001",
    first_name: "Susan",
    last_name: "Collins",
    official_full_name: "Susan Collins",
    chamber: "sen",
    state: "WA",
    district: null,
    party: "Democrat",
    state_rank: "senior",
    birthday: "1965-03-12",
    in_office: true,
  },
  {
    bioguide_id: "W000002",
    first_name: "Adam",
    last_name: "Smith",
    official_full_name: "Adam Smith",
    chamber: "rep",
    state: "WA",
    district: 9,
    party: "Democrat",
    state_rank: null,
    birthday: "1970-06-15",
    in_office: true,
  },
  {
    bioguide_id: "S000001",
    first_name: "Hank",
    last_name: "Green",
    official_full_name: "Hank Green",
    chamber: "sen",
    state: "MT",
    district: null,
    party: "Democrat",
    state_rank: "senior",
    birthday: "1980-05-05",
    in_office: true,
  },
  {
    bioguide_id: "S000002",
    first_name: "John",
    last_name: "Green",
    official_full_name: "John Green",
    chamber: "sen",
    state: "IN",
    district: null,
    party: "Democrat",
    state_rank: "junior",
    birthday: "1977-08-24",
    in_office: true,
  },
  {
    bioguide_id: "R000001",
    first_name: "April",
    last_name: "May",
    official_full_name: "April May",
    chamber: "rep",
    state: "IN",
    district: 1,
    party: "Democrat",
    state_rank: null,
    birthday: "1980-04-01",
    in_office: true,
  },
  {
    bioguide_id: "R000002",
    first_name: "Peter",
    last_name: "Petrawicki",
    official_full_name: "Peter Petrawicki",
    chamber: "rep",
    state: "IN",
    district: 2,
    party: "Republican",
    state_rank: null,
    birthday: "1955-06-15",
    in_office: true,
  },
  {
    bioguide_id: "R000003",
    first_name: "Andy",
    last_name: "Skampt",
    official_full_name: "Andy Skampt",
    chamber: "rep",
    state: "IN",
    district: 3,
    party: "Independent",
    state_rank: null,
    birthday: "1992-09-20",
    in_office: true,
  },
  {
    bioguide_id: "R000004",
    first_name: "Miranda",
    last_name: "Beckwith",
    official_full_name: "Miranda Beckwith",
    chamber: "rep",
    state: "IN",
    district: 4,
    party: "Democrat",
    state_rank: null,
    birthday: "1978-11-30",
    in_office: true,
  },
];
