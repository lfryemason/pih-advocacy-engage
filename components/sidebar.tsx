"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, PanelLeftClose } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import logo from "@/app/assets/engage-logo.png";
import React from "react";

export function Sidebar() {
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <aside
      aria-label="Sidebar"
      className="flex min-h-full flex-col border-r transition-[width] duration-300 ease-in-out"
      style={{
        width: isCollapsed ? "50px" : "275px",
        backgroundColor: "hsl(var(--sidebar))",
        color: "hsl(var(--sidebar-foreground))",
      }}
    >
      <nav aria-label="Main navigation">
        <div
          className="flex max-h-[125px] flex-row items-center justify-between gap-6 border-b border-border py-6"
          style={{
            paddingLeft: isCollapsed ? "8px" : "24px",
            paddingRight: isCollapsed ? "8px" : "24px",
          }}
        >
          {!isCollapsed && (
            <Link href="/" className="">
              <Image
                src={logo}
                alt="PIH Advocacy Engage"
                className="block h-auto max-h-[76px] w-auto"
              />
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="h-fit rounded-md p-0 hover:bg-muted"
          >
            <PanelLeftClose size={32} strokeWidth={1} />
          </button>
        </div>
      </nav>
      <div
        className="mt-auto pb-4"
        style={{
          paddingLeft: isCollapsed ? "8px" : "24px",
          paddingRight: isCollapsed ? "8px" : "24px",
        }}
      >
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2 text-sm transition-colors hover:bg-muted"
        >
          <LogOut size={20} />
          {!isCollapsed && <>Logout</>}
        </button>
      </div>
    </aside>
  );
}
