import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth/role";
import { ORG_ID } from "@/lib/org";
import { StafferList } from "@/components/staffers/staffer-list";

export default async function RepresentativePage({
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

  const [{ data: staffers }, role] = await Promise.all([
    supabase
      .from("staffers")
      .select()
      .eq("representative_id", representative.id)
      .order("last_name", { ascending: true }),
    getCurrentRole(),
  ]);

  const canDelete =
    role?.role === "super_admin" ||
    (role?.role === "org_admin" && role.org_id === ORG_ID);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
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
    </div>
  );
}
