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
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import logo from "@/app/assets/engage-logo.png";
import React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  label,
  icon: Icon,
  isCollapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size: number }>;
  isCollapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border py-3",
        isCollapsed ? "justify-center px-0" : "px-6",
        isActive
          ? "bg-[#F4A42E] font-semibold underline hover:bg-[#F4A42E]"
          : "hover:bg-[#F9D196]",
      )}
    >
      <Icon size={20} />
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [fullName, setFullName] = React.useState<string | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", data.user.id)
        .single();
      if (profile) {
        const combined = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ");
        setFullName(combined || null);
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
      className="hidden h-full flex-col border-r transition-[width] duration-300 ease-in-out md:flex"
      data-breakpoint="md"
      style={{
        width: isCollapsed ? "50px" : "275px",
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
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
                priority
              />
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            type="button"
            className="h-fit rounded-md p-0 hover:bg-accent"
            aria-label="Collapse sidebar"
          >
            {isCollapsed ? (
              <PanelLeftOpen size={32} strokeWidth={1} />
            ) : (
              <PanelLeftClose size={32} strokeWidth={1} />
            )}
          </button>
        </div>
        <NavLink
          href="/meetings"
          label="Meetings"
          icon={Calendar}
          isCollapsed={isCollapsed}
        />
        <NavLink
          href="/representatives"
          label="Representatives"
          icon={Landmark}
          isCollapsed={isCollapsed}
        />
        <NavLink
          href="/teams"
          label="Teams"
          icon={UsersRound}
          isCollapsed={isCollapsed}
        />
        <NavLink
          href="/profile"
          label={fullName ? `${fullName}` : "Profile"}
          icon={UserCircle}
          isCollapsed={isCollapsed}
        />
      </nav>
      <div
        className={`mt-auto flex gap-2 pb-4 ${isCollapsed ? "flex-col items-center" : "flex-row items-center"}`}
        style={{
          paddingLeft: isCollapsed ? "8px" : "24px",
          paddingRight: isCollapsed ? "8px" : "24px",
        }}
      >
        <button
          onClick={handleLogout}
          type="button"
          className={`flex items-center justify-center gap-2 rounded-md border border-border text-sm transition-colors hover:bg-accent ${isCollapsed ? "w-full p-2" : "flex-1 py-2"}`}
        >
          <LogOut size={20} />
          {!isCollapsed && <>Logout</>}
        </button>
        <ThemeToggle isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
