"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import logo from "@/app/assets/engage-logo.png";

export function Sidebar() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <aside
      aria-label="Sidebar"
      className="fixed left-0 top-0 flex h-full w-[300px] flex-col"
      style={{
        backgroundColor: "hsl(var(--sidebar))",
        color: "hsl(var(--sidebar-foreground))",
      }}
    >
      <nav aria-label="Main navigation">
        <div className="border-b border-r border-border bg-white p-6">
          <Link href="/">
            <Image
              src={logo}
              alt="PIH Advocacy Engage"
              className="h-auto w-auto"
            />
          </Link>
        </div>
      </nav>
      <div className="mt-auto p-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
