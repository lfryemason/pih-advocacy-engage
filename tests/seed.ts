export const TEST_USER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
export const SEED_TEAM_ID = "22222222-2222-2222-2222-222222222222";
export const SEED_TEAM_NO_MEMBER_ID = "33333333-3333-3333-3333-333333333333";
export const SEED_TEAM_HMC_ID = "66666666-6666-6666-6666-666666666666";
export const SEED_TEAM_BOB_ID = "77777777-7777-7777-7777-777777777777";
export const SEED_MEETING_UPCOMING_ID = "44444444-4444-4444-4444-444444444444";
export const SEED_MEETING_PAST_ID = "55555555-5555-5555-5555-555555555555";
// Adam Smith (WA-09) — used in seed meetings. Must match SEED_REPRESENTATIVES.
export const SEED_REP_WA_BIOGUIDE = "W000002";
export const TEST_EMAIL = "playwright@example.com";
export const TEST_PASSWORD = "Playwright1!";

// Additional seed users for diverse memberships on Seattle team
export const SEED_USER_2_ID = "bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee";
export const SEED_USER_3_ID = "cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee";
export const SEED_USER_4_ID = "dddddddd-bbbb-cccc-dddd-eeeeeeeeeeee";
export const SEED_USER_5_ID = "eeeeeeee-bbbb-cccc-dddd-eeeeeeeeeeee";

// Delegation-search test users (used by US4 tests)
export const SEED_USER_ALICE_ID = "a1a1a1a1-bbbb-cccc-dddd-eeeeeeeeeeee";
export const SEED_USER_BOB_ID = "b2b2b2b2-bbbb-cccc-dddd-eeeeeeeeeeee";
export const SEED_USER_CAROL_ID = "c3c3c3c3-bbbb-cccc-dddd-eeeeeeeeeeee";

// Placeholder teammate: a login-less account (no password, unconfirmed
// email) that can be claimed by signing up with its email.
export const SEED_USER_PLACEHOLDER_ID = "d4d4d4d4-bbbb-cccc-dddd-eeeeeeeeeeee";
export const SEED_PLACEHOLDER_EMAIL = "placeholder@example.com";

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

export const SEED_EXTRA_PROFILES = [
  {
    user_id: SEED_USER_2_ID,
    org_id: "pihe",
    email: "user2@example.com",
    first_name: "Alex",
    last_name: "Rivera",
    pronouns: "he/him",
    state: "WA",
    congressional_district: "9",
  },
  {
    user_id: SEED_USER_3_ID,
    org_id: "pihe",
    email: "user3@example.com",
    first_name: "Jordan",
    last_name: "Kim",
    pronouns: "she/her",
    state: "WA",
    congressional_district: "9",
  },
  {
    user_id: SEED_USER_4_ID,
    org_id: "pihe",
    email: "user4@example.com",
    first_name: "Morgan",
    last_name: "Chen",
    pronouns: null,
    state: "WA",
    congressional_district: "9",
  },
  {
    user_id: SEED_USER_5_ID,
    org_id: "pihe",
    email: "user5@example.com",
    first_name: "Sam",
    last_name: "Patel",
    pronouns: "they/them",
    state: "PA",
    congressional_district: "5",
  },
  {
    user_id: SEED_USER_ALICE_ID,
    org_id: "pihe",
    email: "alice@example.com",
    first_name: "Alice",
    last_name: "Smith",
    pronouns: null,
    state: "WA",
    congressional_district: "9",
  },
  {
    user_id: SEED_USER_BOB_ID,
    org_id: "pihe",
    email: "bob@example.com",
    first_name: "Bob",
    last_name: "Jones",
    pronouns: null,
    state: "OR",
    congressional_district: "1",
  },
  {
    user_id: SEED_USER_CAROL_ID,
    org_id: "pihe",
    email: "carol@example.com",
    first_name: "Carol",
    last_name: "Solo",
    pronouns: null,
    state: "PA",
    congressional_district: "5",
  },
];

// Upserted separately from SEED_EXTRA_PROFILES because it carries the
// is_placeholder column (bulk upsert rows must share the same keys).
export const SEED_PLACEHOLDER_PROFILE = {
  user_id: SEED_USER_PLACEHOLDER_ID,
  org_id: "pihe",
  email: SEED_PLACEHOLDER_EMAIL,
  first_name: "Penny",
  last_name: "Placeholder",
  pronouns: "she/her",
  state: "PA",
  congressional_district: "5",
  is_placeholder: true,
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
    congressional_districts: [],
  },
  {
    id: SEED_TEAM_HMC_ID,
    org_id: "pihe",
    name: "Haverford/Bryn Mawr College",
    slug: "haverford-bryn-mawr-college",
    state: "PA",
    type: "university",
    description: null,
    founded_date: null,
    congressional_districts: ["4", "5"],
  },
  {
    id: SEED_TEAM_BOB_ID,
    org_id: "pihe",
    name: "Boston University",
    slug: "boston-university",
    state: "MA",
    type: "university",
    description: null,
    founded_date: null,
    congressional_districts: [],
  },
];

export const SEED_TEAM_MEMBERSHIPS = [
  // Seattle High School — full leadership set + a general member
  {
    team_id: SEED_TEAM_ID,
    user_id: TEST_USER_ID,
    org_id: "pihe",
    role: "team_coordinator",
  },
  {
    team_id: SEED_TEAM_ID,
    user_id: SEED_USER_2_ID,
    org_id: "pihe",
    role: "advocacy_lead",
  },
  {
    team_id: SEED_TEAM_ID,
    user_id: SEED_USER_3_ID,
    org_id: "pihe",
    role: "community_building_lead",
  },
  {
    team_id: SEED_TEAM_ID,
    user_id: SEED_USER_4_ID,
    org_id: "pihe",
    role: "fundraising_lead",
  },
  {
    team_id: SEED_TEAM_ID,
    user_id: SEED_USER_5_ID,
    org_id: "pihe",
    role: "member",
  },
  // Haverford/Bryn Mawr College — basic coordinator seed
  {
    team_id: SEED_TEAM_HMC_ID,
    user_id: TEST_USER_ID,
    org_id: "pihe",
    role: "team_coordinator",
  },
  // Delegation-search test users
  {
    team_id: SEED_TEAM_ID,
    user_id: SEED_USER_ALICE_ID,
    org_id: "pihe",
    role: "member",
  },
  {
    team_id: SEED_TEAM_BOB_ID,
    user_id: SEED_USER_BOB_ID,
    org_id: "pihe",
    role: "member",
  },
  {
    team_id: SEED_TEAM_HMC_ID,
    user_id: SEED_USER_CAROL_ID,
    org_id: "pihe",
    role: "member",
  },
  // Placeholder teammate on the Haverford team
  {
    team_id: SEED_TEAM_HMC_ID,
    user_id: SEED_USER_PLACEHOLDER_ID,
    org_id: "pihe",
    role: "member",
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
    pronouns: "he/him",
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
    pronouns: "she/her",
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
