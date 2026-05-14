import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth/role";
import { ORG_ID } from "@/lib/org";
import { Button } from "@/components/ui/button";
import { StafferList } from "@/components/staffers/staffer-list";
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

  const [{ data: staffers, error: staffersError }, role] = await Promise.all([
    supabase
      .from("staffers")
      .select()
      .eq("representative_id", representative.id)
      .eq("org_id", ORG_ID)
      .order("last_name", { ascending: true }),
    getCurrentRole(),
  ]);

  if (staffersError) {
    throw new Error(`Failed to load staffers: ${staffersError.message}`);
  }

  const canDelete =
    role?.role === "super_admin" ||
    (role?.role === "org_admin" && role.org_id === ORG_ID);

  return (
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/representatives" aria-label="Representatives">
            <span aria-hidden="true">← </span>
            Representatives
          </Link>
        </Button>
      </div>
      <h1 className="mt-4 text-2xl font-bold">
        {representative.official_full_name ??
          `${representative.first_name} ${representative.last_name}`}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {representative.party} — {representative.state}
      </p>
      <StafferList
        representativeId={representative.id}
        orgId={ORG_ID}
        staffers={staffers ?? []}
        canDelete={canDelete}
      />
    </>
  );
}
