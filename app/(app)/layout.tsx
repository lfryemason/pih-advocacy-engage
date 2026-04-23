import { Suspense } from "react";
import { MobileHeader } from "@/components/mobile-header";
import { Sidebar } from "@/components/sidebar";
import { getCurrentProfile } from "@/lib/auth/profile";

async function SidebarWithRole() {
  const profile = await getCurrentProfile();
  return <Sidebar role={profile?.role ?? null} />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh flex-col md:flex-row">
      <MobileHeader />
      <Suspense fallback={<Sidebar role={null} />}>
        <SidebarWithRole />
      </Suspense>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
