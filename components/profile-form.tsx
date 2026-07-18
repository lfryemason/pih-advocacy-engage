"use client";

import { useState, useEffect, useId } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormActionBar } from "@/components/form-action-bar";
import { US_STATES, getDistrictOptions } from "@/lib/us-districts";

// `children` (the Delete account action) sits on the left of the sticky action
// bar, opposite Save, per the profile page mock.
export function ProfileForm({ children }: { children?: React.ReactNode }) {
  const formId = useId();
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setEmail(data.user.email ?? "");
        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "first_name, last_name, pronouns, state, congressional_district",
          )
          .eq("user_id", data.user.id)
          .single();
        if (profile) {
          setFirstName(profile.first_name ?? "");
          setLastName(profile.last_name ?? "");
          setPronouns(profile.pronouns ?? "");
          setState(profile.state ?? "");
          setDistrict(profile.congressional_district ?? "");
        }
      }
      setIsLoadingUser(false);
    });
  }, []);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(e.target.value);
    setDistrict("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          pronouns,
          state,
          congressional_district: district || null,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      setSuccess("Profile saved successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const actionBar = (
    <FormActionBar>
      {children}
      <div className="ml-auto flex gap-2">
        <Button
          type="submit"
          form={formId}
          disabled={isLoading || isLoadingUser}
        >
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </FormActionBar>
  );

  if (isLoadingUser) {
    return (
      <>
        <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
        {actionBar}
      </>
    );
  }

  const districtOptions = getDistrictOptions(state);

  return (
    <>
      <form
        id={formId}
        onSubmit={handleSubmit}
        className="mt-6 flex max-w-lg flex-col gap-6"
      >
        <div className="grid gap-2">
          <Label htmlFor="first-name">First Name</Label>
          <Input
            id="first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="last-name">Last Name</Label>
          <Input
            id="last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pronouns">Pronouns</Label>
          <Input
            id="pronouns"
            type="text"
            placeholder="e.g. they/them"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} disabled />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state">State</Label>
          <Select id="state" value={state} onChange={handleStateChange}>
            <option value="">Select a state</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="district">Congressional District</Label>
          <Select
            id="district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={!state}
          >
            <option value="">
              {state ? "Select a district" : "Select a state first"}
            </option>
            {districtOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </form>
      {actionBar}
    </>
  );
}
