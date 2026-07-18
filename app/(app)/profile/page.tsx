import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile-form";
import { DeleteAccountSection } from "@/components/profile/delete-account-section";

export const metadata: Metadata = { title: "Profile" };

export default function Profile() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your Engage account details
      </p>
      <ProfileForm>
        <DeleteAccountSection />
      </ProfileForm>
    </div>
  );
}
