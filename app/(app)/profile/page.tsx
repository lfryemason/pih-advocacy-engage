import { ProfileForm } from "@/components/profile-form";

export default function Profile() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your Engage account details
      </p>
      <ProfileForm />
    </div>
  );
}
