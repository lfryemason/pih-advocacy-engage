import { MobileHeader } from "@/components/mobile-header";
import { Sidebar } from "@/components/sidebar";
import { getIsAdmin, getIsFacilitator, requireRole } from "@/lib/auth/guards";
import { CurrentUserProvider } from "@/lib/auth/use-current-user";
import { ORG_ID } from "@/lib/org";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await requireRole();

  const isAdmin = await getIsAdmin(ORG_ID);
  const isFacilitator = await getIsFacilitator(ORG_ID);

  return (
    <div className="flex h-svh flex-col md:flex-row">
      <MobileHeader isAdmin={isAdmin} />
      <Sidebar isAdmin={isAdmin} />
      <CurrentUserProvider
        userId={current.user_id}
        isAdmin={isAdmin}
        isFacilitator={isFacilitator}
      >
        <main className="flex-1 overflow-y-auto">{children}</main>
      </CurrentUserProvider>
    </div>
  );
}
