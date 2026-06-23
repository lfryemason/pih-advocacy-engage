import { Suspense } from "react";
import type { Metadata } from "next";
import { requireOrgAdmin } from "@/lib/auth/guards";
import { ORG_ID } from "@/lib/org";
import { UsersList } from "@/components/admin/users-list";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireOrgAdmin(ORG_ID);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Admin</h1>
      <h2 className="mt-6 text-xl font-semibold">User list</h2>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <UsersList />
      </Suspense>
    </div>
  );
}
