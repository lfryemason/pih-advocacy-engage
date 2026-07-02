import Link from "next/link";
import type { Metadata } from "next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TeamForm } from "@/components/teams/team-form";
import { ORG_ID } from "@/lib/org";

export const metadata: Metadata = { title: "Create a new team" };

export default function NewTeamPage() {
  return (
    <div className="p-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/teams">Teams</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create a new team</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="mt-4 text-2xl font-bold">Create a new team</h1>
      <div className="mt-6">
        <TeamForm orgId={ORG_ID} cancelHref="/teams" />
      </div>
    </div>
  );
}
