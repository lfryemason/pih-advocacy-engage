import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";

const LEGISLATORS_URL =
  "https://unitedstates.github.io/congress-legislators/legislators-current.json";

const BATCH_SIZE = 100;

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
  id: { bioguide: string };
  name: { first: string; last: string; official_full?: string };
  bio: { birthday?: string; gender?: string };
  terms: LegislatorTerm[];
}

type RepresentativeInsert =
  Database["public"]["Tables"]["representatives"]["Insert"];

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

  console.log(`Fetching legislators from ${LEGISLATORS_URL}...`);
  const response = await fetch(LEGISLATORS_URL);
  if (!response.ok) {
    console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const legislators: Legislator[] = await response.json();
  console.log(`Fetched ${legislators.length} legislators`);

  const records: RepresentativeInsert[] = legislators
    .filter((leg) => leg.terms.length > 0)
    .map((leg) => {
      const latestTerm = leg.terms[leg.terms.length - 1];
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
        in_office: true,
      };
    });

  let upserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("representatives")
      .upsert(batch, { onConflict: "bioguide_id" });

    if (error) {
      console.error(`Error upserting batch at index ${i}:`, error);
      process.exit(1);
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
    console.error("Error marking former representatives:", updateError);
    process.exit(1);
  }

  console.log("Marked representatives not in current data as out of office");
  console.log("Done!");
}

main();
