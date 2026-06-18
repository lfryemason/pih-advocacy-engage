import Image from "next/image";
import { BookOpen, ListChecks } from "lucide-react";
import type { ComponentType } from "react";
import pihLogo from "@/app/icon.png";
import discordLogo from "@/public/discord.svg";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <Image
      src={discordLogo}
      alt="Discord"
      className={className}
      aria-hidden="true"
    />
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

export function ResourceLinks() {
  const resources: Array<{
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
      href: process.env.DISCORD_INVITE_URL ?? "",
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

  return (
    <section
      aria-labelledby="resources-heading"
      className="flex flex-col gap-6"
    >
      <h2 id="resources-heading" className="text-xl font-bold">
        Resources
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2" role="list">
        {resources.map(({ label, href, description, Icon }) => (
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
