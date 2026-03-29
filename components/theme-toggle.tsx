"use client";

import { Sun, Moon, Contrast } from "lucide-react";
import { useTheme } from "next-themes";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES = ["light", "dark", "high-contrast"] as const;
type Theme = (typeof THEMES)[number];

const THEME_ICONS: Record<Theme, React.ComponentType<{ size: number }>> = {
  light: Sun,
  dark: Moon,
  "high-contrast": Contrast,
};

const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  "high-contrast": "High Contrast",
};

export function ThemeToggle({ isCollapsed }: { isCollapsed?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const current = (theme ?? resolvedTheme ?? "light") as Theme;
  const Icon = mounted ? (THEME_ICONS[current] ?? Sun) : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Select theme"
          className={`flex items-center justify-center rounded-md border border-border p-2 transition-colors hover:bg-muted ${isCollapsed ? "w-full shrink-0" : "shrink-0"}`}
        >
          <Icon size={20} />
</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((t) => {
          const ItemIcon = THEME_ICONS[t];
          return (
            <DropdownMenuItem
              key={t}
              onClick={() => setTheme(t)}
              className="flex items-center gap-2"
              aria-current={mounted && current === t ? "true" : undefined}
            >
              <ItemIcon size={16} />
              {THEME_LABELS[t]}
              {mounted && current === t && (
                <span className="ml-auto text-xs opacity-60">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
