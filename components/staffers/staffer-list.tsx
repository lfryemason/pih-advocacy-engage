import { Tables } from "@/lib/supabase/database.types";
import { AddStafferRow } from "@/components/staffers/add-staffer-row";
import { StafferRow } from "@/components/staffers/staffer-row";

type Staffer = Tables<"staffers">;

export function StafferList({
  representativeId,
  orgId,
  staffers,
  canDelete,
}: {
  representativeId: string;
  orgId: string;
  staffers: Staffer[];
  canDelete: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Office Staff</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {staffers.map((staffer) => (
          <StafferRow
            key={staffer.id}
            staffer={staffer}
            canDelete={canDelete}
            orgId={orgId}
          />
        ))}
      </div>
      <div className="mt-3">
        <AddStafferRow representativeId={representativeId} orgId={orgId} />
      </div>
    </section>
  );
}
