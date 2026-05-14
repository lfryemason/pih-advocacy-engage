import type { Metadata } from "next";
import { RepresentativesPageClient } from "@/components/representatives/representatives-page-client";

export const metadata: Metadata = { title: "Representatives" };

export default function Representatives() {
  return <RepresentativesPageClient />;
}
