import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";

const LEGISLATORS_URL =
  "https://unitedstates.github.io/congress-legislators/legislators-current.json";

const BATCH_SIZE = 100;

interface LegislatorId {
  bioguide: string;
  govtrack?: number;
  opensecrets?: string;
}

interface LegislatorTerm {
  type: "sen" | "rep";
  start: string;
  end: string;
  state: string;
  district?: number;
  party: string;
  state_rank?: "junior" | "senior";
  url?: string;
  contact_form?: string;
}

interface Legislator {
  id: LegislatorId;
  name: { first: string; last: string; official_full?: string };
  bio: { birthday?: string; gender?: string };
  terms: LegislatorTerm[];
}

type RepresentativeInsert =
  Database["public"]["Tables"]["representatives"]["Insert"];

type GeneralLink = { label: string; url: string; category: string };

function buildGeneralLinks(leg: Legislator): GeneralLink[] {
  const { bioguide, govtrack, opensecrets } = leg.id;
  const first = leg.name.first.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const last = leg.name.last.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const links: GeneralLink[] = [
    {
      label: "Congress.gov Profile",
      url: `https://www.congress.gov/member/${first}-${last}/${bioguide}`,
      category: "profile",
    },
  ];

  if (govtrack) {
    links.push({
      label: "GovTrack Voting Record",
      url: `https://www.govtrack.us/congress/members/person/${govtrack}`,
      category: "voting_record",
    });
  }

  if (opensecrets) {
    links.push({
      label: "OpenSecrets — Campaign Finance",
      url: `https://www.opensecrets.org/members-of-congress/summary?cid=${opensecrets}`,
      category: "campaign_finance",
    });
  }

  return links;
}

// The congress-legislators dataset has no pronoun field, but it does carry a
// binary gender indicator ("M"/"F"). We use it as a best-effort estimate.
// Anything unrecognized (including a future non-binary/unspecified value) is
// left null so we never guess — the UI simply omits pronouns when null.
function pronounsFromGender(gender: string | undefined): string | null {
  if (gender === "M") return "he/him";
  if (gender === "F") return "she/her";
  return null;
}

export async function seedRepresentatives(
  supabaseUrl: string,
  serviceRoleKey: string,
) {
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  console.log(`Fetching legislators from ${LEGISLATORS_URL}...`);
  const response = await fetch(LEGISLATORS_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`,
    );
  }

  const legislators: Legislator[] = await response.json();
  console.log(`Fetched ${legislators.length} legislators`);

  const records: RepresentativeInsert[] = legislators
    .filter((leg) => leg.terms.length > 0)
    .map((leg) => {
      const latestTerm = leg.terms.reduce((a, b) =>
        a.start > b.start ? a : b,
      );
      return {
        bioguide_id: leg.id.bioguide,
        first_name: leg.name.first,
        last_name: leg.name.last,
        official_full_name: leg.name.official_full ?? null,
        chamber: latestTerm.type,
        state: latestTerm.state,
        district: latestTerm.district ?? null,
        party: latestTerm.party,
        state_rank: latestTerm.state_rank ?? null,
        birthday: leg.bio.birthday ?? null,
        pronouns: pronounsFromGender(leg.bio.gender),
        in_office: true,
        general_links: buildGeneralLinks(leg),
      };
    });

  if (records.length === 0) {
    throw new Error("Upstream returned no legislators");
  }

  let upserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("representatives")
      .upsert(batch, { onConflict: "bioguide_id" });

    if (error) {
      throw new Error(`Error upserting batch at index ${i}: ${error.message}`);
    }

    upserted += batch.length;
    console.log(`Upserted ${upserted}/${records.length}`);
  }

  // Mark any representatives not in the current data as out of office
  const currentBioguideIds = records.map((r) => r.bioguide_id);
  const { error: updateError } = await supabase
    .from("representatives")
    .update({ in_office: false })
    .not("bioguide_id", "in", `(${currentBioguideIds.join(",")})`);

  if (updateError) {
    throw new Error(
      `Error marking former representatives: ${updateError.message}`,
    );
  }

  console.log("Marked representatives not in current data as out of office");
  console.log("Done!");
}

async function main() {
  const supabaseUrl =
    process.env.API_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing Supabase credentials.\n" +
        "  Required: API_URL (or NEXT_PUBLIC_SUPABASE_URL) and SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)\n" +
        '  Run: eval "$(npx supabase status -o env)"',
    );
    process.exit(1);
  }

  try {
    await seedRepresentatives(supabaseUrl, serviceRoleKey);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
