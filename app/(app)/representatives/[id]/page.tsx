import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth/role";
import { ORG_ID } from "@/lib/org";
import { Button } from "@/components/ui/button";
import { StafferList } from "@/components/staffers/staffer-list";
import { RepMeetings } from "@/components/meetings/rep-meetings";
import { RepTeamsSection } from "@/components/representatives/rep-teams-section";
import {
  RepExternalResources,
  type GeneralLink,
} from "@/components/representatives/rep-external-resources";
import { SuspenseWithDefaultFallback } from "@/components/suspense-with-default-fallback";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("representatives")
    .select("official_full_name, first_name, last_name")
    .eq("bioguide_id", id)
    .single();

  const name = data
    ? (data.official_full_name ?? `${data.first_name} ${data.last_name}`)
    : "Representative";

  return { title: name };
}

export default function RepresentativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <SuspenseWithDefaultFallback>
      <RepresentativeContent params={params} />
    </SuspenseWithDefaultFallback>
  );
}

const partyAvatarClass: Record<string, string> = {
  Democrat: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Republican: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Independent:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const partyTextClass: Record<string, string> = {
  Democrat: "text-blue-700 dark:text-blue-300",
  Republican: "text-red-700 dark:text-red-300",
  Independent: "text-purple-700 dark:text-purple-300",
};

async function RepresentativeContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: representative } = await supabase
    .from("representatives")
    .select()
    .eq("bioguide_id", id)
    .single();

  if (!representative) {
    notFound();
  }

  const [{ data: staffers, error: staffersError }, { data: orgInfo }, role] =
    await Promise.all([
      supabase
        .from("staffers")
        .select()
        .eq("representative_id", representative.id)
        .eq("org_id", ORG_ID)
        .order("last_name", { ascending: true }),
      supabase
        .from("representative_org_info")
        .select("links")
        .eq("representative_id", representative.id)
        .eq("org_id", ORG_ID)
        .maybeSingle(),
      getCurrentRole(),
    ]);

  if (staffersError) {
    throw new Error(`Failed to load staffers: ${staffersError.message}`);
  }

  const canDelete =
    role?.role === "super_admin" ||
    (role?.role === "org_admin" && role.org_id === ORG_ID);

  const canEdit =
    role?.role === "super_admin" ||
    (role?.role === "org_admin" && role.org_id === ORG_ID);

  const name =
    representative.official_full_name ??
    `${representative.first_name} ${representative.last_name}`;
  const initial = representative.first_name[0].toUpperCase();
  const chamber = representative.chamber === "sen" ? "Senate" : "House";
  const avatarClass =
    partyAvatarClass[representative.party] ?? "bg-muted text-muted-foreground";
  const textClass = partyTextClass[representative.party] ?? "";
  const generalLinks = Array.isArray(representative.general_links)
    ? (representative.general_links as GeneralLink[])
    : [];
  const orgLinks = Array.isArray(orgInfo?.links)
    ? (orgInfo.links as GeneralLink[])
    : [];

  return (
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/representatives" aria-label="Members of Congress">
            <span aria-hidden="true">← </span>
            Members of Congress
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mt-4 flex items-center gap-4 rounded-lg border p-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${avatarClass}`}
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 className="text-xl font-bold">{name}</h1>
            {representative.pronouns && (
              <span className="text-sm text-muted-foreground">
                {representative.pronouns}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className={`font-medium ${textClass}`}>
              {representative.party}
            </span>
            <span className="text-muted-foreground" aria-hidden="true">
              ·
            </span>
            <span className="text-muted-foreground">{chamber}</span>
            <span className="text-muted-foreground" aria-hidden="true">
              ·
            </span>
            <span className="text-muted-foreground">
              {representative.state}
            </span>
            {representative.email && (
              <>
                <span className="text-muted-foreground" aria-hidden="true">
                  ·
                </span>
                <a
                  href={`mailto:${representative.email}`}
                  className="text-primary hover:underline"
                >
                  {representative.email}
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      <RepMeetings representativeId={representative.id} />

      <StafferList
        representativeId={representative.id}
        orgId={ORG_ID}
        staffers={staffers ?? []}
        canDelete={canDelete}
      />

      <RepTeamsSection
        repState={representative.state}
        chamber={representative.chamber}
        district={representative.district}
      />

      <RepExternalResources
        representativeId={representative.id}
        orgId={ORG_ID}
        generalLinks={generalLinks}
        initialOrgLinks={orgLinks}
        canEdit={canEdit}
      />
    </>
  );
}
