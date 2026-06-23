"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import {
  Calendar,
  ChevronDown,
  Contrast,
  Landmark,
  LogOut,
  Menu,
  Moon,
  Palette,
  ShieldUser,
  Sun,
  UserCircle,
  UsersRound,
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import logo from "@/app/assets/engage-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "high-contrast", label: "High Contrast", icon: Contrast },
] as const;

export function MobileHeader({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [firstName, setFirstName] = React.useState<string | null>(null);
  const [themeOpen, setThemeOpen] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("user_id", data.user.id)
        .single();
      if (profile?.first_name) setFirstName(profile.first_name);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <DropdownMenu onOpenChange={(open) => !open && setThemeOpen(false)}>
      <DropdownMenuTrigger asChild>
        <header
          aria-label="Header"
          className="flex h-[50px] shrink-0 cursor-pointer items-center justify-between border-b border-border bg-background px-4 md:hidden"
        >
          <Link href="/" aria-label="Home" onClick={(e) => e.stopPropagation()}>
            <Image
              src={logo}
              alt="PIH Advocacy Engage"
              onPointerDown={(e) => e.stopPropagation()}
              className="block h-auto max-h-[36px] w-auto"
              priority
            />
          </Link>
          <Menu size={24} aria-label="Open menu" />
        </header>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={0}
        className="w-screen rounded-none"
      >
        <DropdownMenuItem asChild>
          <Link href="/meetings" className="flex items-center gap-2">
            <Calendar size={16} />
            Meetings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/representatives" className="flex items-center gap-2">
            <Landmark size={16} />
            Members of Congress
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/teams" className="flex items-center gap-2">
            <UsersRound size={16} />
            Teams
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <UserCircle size={16} />
            {firstName ? `${firstName}'s profile` : "Profile"}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-2">
              <ShieldUser size={16} />
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setThemeOpen((v) => !v);
          }}
          className="flex items-center gap-2"
        >
          <Palette size={16} />
          Theme
          <ChevronDown
            size={16}
            className={`ml-auto transition-transform ${themeOpen ? "rotate-180" : ""}`}
          />
        </DropdownMenuItem>
        {themeOpen &&
          THEMES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setTheme(value)}
              className="flex items-center gap-2 pl-8"
            >
              <Icon size={16} />
              {label}
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
