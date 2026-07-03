import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Authentication Error" };
import { Suspense } from "react";

// Map internal reason codes to user-facing copy. We intentionally don't render
// raw backend error strings — the caller passes a known code, never a message.
const REASON_MESSAGES: Record<string, string> = {
  "invalid-link":
    "This link is invalid or has expired. Request a new email and try again.",
  "missing-token":
    "This link is missing information. Please use the full link from your email.",
};

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const message =
    (params?.reason && REASON_MESSAGES[params.reason]) ??
    "An unspecified error occurred.";

  return <p className="text-sm text-muted-foreground">{message}</p>;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Sorry, something went wrong.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
