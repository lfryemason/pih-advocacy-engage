import type { Metadata } from "next";
import { Suspense } from "react";
import { MeetingsPage } from "@/components/meetings/meetings-page";

export const metadata: Metadata = { title: "Meetings" };

export default function Meetings() {
  return (
    <Suspense>
      <MeetingsPage />
    </Suspense>
  );
}
