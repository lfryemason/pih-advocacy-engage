import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import tailwindcssAnimate from "tailwindcss-animate";
import containerQueries from "@tailwindcss/container-queries";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
          accent: "hsl(var(--popover-accent))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark: "hsl(var(--primary-dark))",
          light: "hsl(var(--primary-light))",
          lighter: "hsl(var(--primary-lighter))",
        },
        "nav-active": {
          DEFAULT: "hsl(var(--nav-active))",
          foreground: "hsl(var(--nav-active-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          dark: "hsl(var(--secondary-dark))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
          "hover-foreground": "hsl(var(--accent-hover-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          dark: "hsl(var(--destructive-dark))",
          light: "hsl(var(--destructive-light))",
          lighter: "hsl(var(--destructive-lighter))",
        },
        "secondary-teal": {
          DEFAULT: "hsl(var(--secondary-teal))",
          foreground: "hsl(var(--secondary-teal-foreground))",
          accent: "hsl(var(--secondary-teal-accent))",
        },
        "secondary-magenta": {
          DEFAULT: "hsl(var(--secondary-magenta))",
          foreground: "hsl(var(--secondary-magenta-foreground))",
          accent: "hsl(var(--secondary-magenta-accent))",
        },
        "secondary-purple": {
          DEFAULT: "hsl(var(--secondary-purple))",
          foreground: "hsl(var(--secondary-purple-foreground))",
          accent: "hsl(var(--secondary-purple-accent))",
        },
        "secondary-green": {
          DEFAULT: "hsl(var(--secondary-green))",
          foreground: "hsl(var(--secondary-green-foreground))",
          accent: "hsl(var(--secondary-green-accent))",
        },
        "secondary-yellow": {
          DEFAULT: "hsl(var(--secondary-yellow))",
          foreground: "hsl(var(--secondary-yellow-foreground))",
          accent: "hsl(var(--secondary-yellow-accent))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate, typography, containerQueries],
} satisfies Config;
