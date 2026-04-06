import { Suspense } from "react";
import { SenatorsTable } from "@/components/representatives/senators-table";

export default function Representatives({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Senators</h1>
      <p className="mb-6 mt-1 text-muted-foreground">
        Current members of the U.S. Senate
      </p>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <SenatorsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
