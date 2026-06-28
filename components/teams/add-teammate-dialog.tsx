"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  createPlaceholderTeammate,
  updatePlaceholderTeammate,
} from "@/lib/teams/placeholder-actions";
import { validatePlaceholderFields } from "@/lib/teams/placeholder-validate";
import { ROLE_OPTIONS, type TeamRole } from "@/lib/teams";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { US_STATES, getDistrictOptions } from "@/lib/us-districts";

/**
 * Create a placeholder teammate, or edit one when `editUserId` is set. Email is
 * read-only in edit mode because the claim flow matches on it.
 */
export function AddTeammateDialog({
  teamId,
  teamSlug,
  editUserId,
}: {
  teamId: string;
  teamSlug: string;
  editUserId?: string;
}) {
  const router = useRouter();
  const isEdit = editUserId !== undefined;

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [role, setRole] = useState<TeamRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (!open || !isEdit) return;
    let cancelled = false;
    setIsLoadingProfile(true);
    const supabase = createClient();
    supabase
      .from("profiles")
      .select(
        "email, first_name, last_name, pronouns, state, congressional_district",
      )
      .eq("user_id", editUserId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError || !data) {
          setError("Failed to load teammate.");
        } else {
          setEmail(data.email);
          setFirstName(data.first_name ?? "");
          setLastName(data.last_name ?? "");
          setPronouns(data.pronouns ?? "");
          setState(data.state ?? "");
          setDistrict(data.congressional_district ?? "");
        }
        setIsLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isEdit, editUserId]);

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setPronouns("");
    setState("");
    setDistrict("");
    setRole("member");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    // Reset before closing so stale values don't flash on the exit transition.
    if (!next) resetForm();
    setOpen(next);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(e.target.value);
    setDistrict("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePlaceholderFields(
      email,
      firstName,
      lastName,
      role,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      pronouns: pronouns.trim(),
      state,
      district,
    };
    const result = isEdit
      ? await updatePlaceholderTeammate({
          userId: editUserId,
          teamSlug,
          ...payload,
        })
      : await createPlaceholderTeammate({
          teamId,
          email: email.trim(),
          role,
          ...payload,
        });
    setIsSaving(false);

    if (result.ok) {
      handleOpenChange(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  };

  const districtOptions = getDistrictOptions(state);
  const idPrefix = isEdit ? "edit-teammate" : "add-teammate";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            variant="ghost"
            size="sm"
            className="px-1 text-muted-foreground"
            aria-label="Edit placeholder teammate"
          >
            <Pencil size={14} aria-hidden="true" />
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add teammate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit teammate" : "Add teammate"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this placeholder teammate's details. The email can't be changed — it's how they'll claim the account."
              : "Add someone who hasn't signed up yet. They can claim this account later by signing up with the same email."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-email`}>
                Email
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </Label>
              <Input
                id={`${idPrefix}-email`}
                type="email"
                placeholder="m@example.com"
                required
                disabled={isEdit}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-first-name`}>First Name</Label>
              <Input
                id={`${idPrefix}-first-name`}
                type="text"
                disabled={isLoadingProfile}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-last-name`}>Last Name</Label>
              <Input
                id={`${idPrefix}-last-name`}
                type="text"
                disabled={isLoadingProfile}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-pronouns`}>Pronouns</Label>
              <Input
                id={`${idPrefix}-pronouns`}
                type="text"
                placeholder="e.g. they/them"
                disabled={isLoadingProfile}
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-state`}>State</Label>
              <Select
                id={`${idPrefix}-state`}
                disabled={isLoadingProfile}
                value={state}
                onChange={handleStateChange}
              >
                <option value="">Select a state</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${idPrefix}-district`}>
                Congressional District
              </Label>
              <Select
                id={`${idPrefix}-district`}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!state || isLoadingProfile}
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
            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-role`}>Team Role</Label>
                <Select
                  id={`${idPrefix}-role`}
                  value={role}
                  onChange={(e) => setRole(e.target.value as TeamRole)}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isLoadingProfile}>
                {isSaving
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Add teammate"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
