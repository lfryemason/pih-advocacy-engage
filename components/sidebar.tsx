"use client";

import Image from "next/image";
import Link from "next/link";
import {
  LogOut,
  PanelLeftClose,
  Calendar,
  UsersRound,
  UserCircle,
  PanelLeftOpen,
  Landmark,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import logo from "@/app/assets/engage-logo.png";
import React from "react";

export function Sidebar() {
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [firstName, setFirstName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const meta = data.user.user_metadata;
      if (meta?.first_name) {
        setFirstName(meta.first_name);
      } else if (meta?.full_name) {
        setFirstName(meta.full_name.split(" ")[0]);
      } else {
        setFirstName(null);
      }
    });
  }, []);

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
            aria-label="Collapse sidebar"
          >
            {isCollapsed ? (
              <PanelLeftOpen size={32} strokeWidth={1} />
            ) : (
              <PanelLeftClose size={32} strokeWidth={1} />
            )}
          </button>
        </div>
        <Link
          href="/meetings"
          aria-label="Meetings"
          className={`flex w-full items-center gap-3 border-b border-border py-3 hover:bg-muted ${isCollapsed ? "justify-center px-0" : "px-6"}`}
        >
          <Calendar size={20} />
          {!isCollapsed && <span className="text-sm">Meetings</span>}
        </Link>
        <Link
          href="/representatives"
          aria-label="Representatives"
          className={`flex w-full items-center gap-3 border-b border-border py-3 hover:bg-muted ${isCollapsed ? "justify-center px-0" : "px-6"}`}
        >
          <Landmark size={20} />
          {!isCollapsed && <span className="text-sm">Representatives</span>}
        </Link>
        <Link
          href="/teams"
          aria-label="Teams"
          className={`flex w-full items-center gap-3 border-b border-border py-3 hover:bg-muted ${isCollapsed ? "justify-center px-0" : "px-6"}`}
        >
          <UsersRound size={20} />
          {!isCollapsed && <span className="text-sm">Teams</span>}
        </Link>
        <Link
          href="/profile"
          aria-label={firstName ? `${firstName}'s profile` : "Profile"}
          className={`flex w-full items-center gap-3 border-b border-border py-3 hover:bg-muted ${isCollapsed ? "justify-center px-0" : "px-6"}`}
        >
          <UserCircle size={20} />
          {!isCollapsed && (
            <span className="text-sm">
              {firstName ? `${firstName}'s profile` : "Profile"}
            </span>
          )}
        </Link>
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
