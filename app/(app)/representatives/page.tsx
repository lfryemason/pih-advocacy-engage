import type { Metadata } from "next";
import { RepresentativesPageClient } from "@/components/representatives/representatives-page-client";

export const metadata: Metadata = { title: "Members of Congress" };

export default function Representatives() {
  return <RepresentativesPageClient />;
}
