import { MobileHeader } from "@/components/mobile-header";
import { Sidebar } from "@/components/sidebar";
import { getIsAdmin, requireRole } from "@/lib/auth/guards";
import { ORG_ID } from "@/lib/org";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: the proxy already gates unauthenticated requests, but
  // don't rely on it alone (middleware auth has a history of bypass CVEs).
  // Re-verify server-side here so every authenticated page sits behind a
  // real session check, not just the edge redirect.
  await requireRole();

  const isAdmin = await getIsAdmin(ORG_ID);

  return (
    <div className="flex h-svh flex-col md:flex-row">
      <MobileHeader isAdmin={isAdmin} />
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
