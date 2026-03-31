import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";

async function ProfileContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const meta = data.user.user_metadata ?? {};

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your Engage account details
      </p>
      <ProfileForm
        email={data.user.email ?? ""}
        initialFirstName={String(meta.first_name ?? "")}
        initialLastName={String(meta.last_name ?? "")}
        initialPronouns={String(meta.pronouns ?? "")}
        initialState={String(meta.state ?? "")}
        initialDistrict={String(meta.congressional_district ?? "")}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
