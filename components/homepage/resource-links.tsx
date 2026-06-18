import Image from "next/image";
import { BookOpen, ListChecks } from "lucide-react";
import type { ComponentType } from "react";
import pihLogo from "@/app/icon.png";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 127.14 96.36"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}

function PihLogoIcon({ className }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex rounded-sm bg-white ${className ?? ""}`}
    >
      <Image src={pihLogo} alt="" fill className="object-contain" />
    </span>
  );
}

const RESOURCES: Array<{
  label: string;
  href: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  {
    label: "Partners in Health",
    href: "https://www.pih.org",
    description:
      "Our parent organization's main website full of information, stories of current work and the mission statement.",
    Icon: PihLogoIcon,
  },
  {
    label: "Community Discord",
    href: "https://discord.gg/pih-advocacy",
    description:
      "Connect with other PIH advocates, hear about the PIHE news and get real-time support",
    Icon: DiscordIcon,
  },
  {
    label: "PIH Engage Resources",
    href: "https://sites.google.com/view/pihengage/home",
    description:
      "All the resources you could want as a PIHE member including the fundraising dashboard, advocacy resources and community building guides.",
    Icon: BookOpen,
  },
  {
    label: "TB Fighter MOC Scoresheet",
    href: "https://tbfightertofu.github.io/hill_day/moc_list.html",
    description:
      "Track how your members of Congress have voted on PIHE priorities - made for TBFighters but still extremely useful for PIHE.",
    Icon: ListChecks,
  },
];

export function ResourceLinks() {
  return (
    <section
      aria-labelledby="resources-heading"
      className="flex flex-col gap-6"
    >
      <h2 id="resources-heading" className="text-xl font-bold">
        Resources
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2" role="list">
        {RESOURCES.map(({ label, href, description, Icon }) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full items-stretch gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="size-7 shrink-0 self-center" />
              <div className="flex flex-col justify-center gap-1">
                <span className="font-medium underline">{label}</span>
                <span className="text-sm text-muted-foreground">
                  {description}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
