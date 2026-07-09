"use client";

import { useEffect, useState } from "react";
import { Pencil, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validatePlaceholderFields } from "@/lib/teams/placeholder-validate";
import { ROLE_OPTIONS, type TeamRole } from "@/lib/teams";
import type { StagedTeammate } from "@/components/teams/use-member-staging";
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
 * Collects the fields for a teammate and reports them to the parent via
 * `onStage`; it writes nothing itself so the changes ride along with the team
 * form's Save. Three uses:
 *   - Add a brand-new placeholder (no `loadUserId`/`initial`): shows the role
 *     picker and an editable email.
 *   - Edit a committed placeholder (`loadUserId`): loads the profile for
 *     prefill; email is read-only because the claim flow matches on it.
 *   - Edit a not-yet-created placeholder (`initial`): prefilled locally; email
 *     stays editable since nothing is created yet.
 * The role is edited inline from the table row, so the picker only shows when
 * adding.
 */
export function AddTeammateDialog({
  onStage,
  loadUserId,
  initial,
}: {
  onStage: (data: StagedTeammate) => void;
  loadUserId?: string;
  initial?: StagedTeammate;
}) {
  const isEdit = loadUserId !== undefined || initial !== undefined;
  const emailDisabled = loadUserId !== undefined;
  const showRole = !isEdit;

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [role, setRole] = useState<TeamRole>(initial?.role ?? "member");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (loadUserId) {
      let cancelled = false;
      setIsLoadingProfile(true);
      const supabase = createClient();
      supabase
        .from("profiles")
        .select(
          "email, first_name, last_name, pronouns, state, congressional_district",
        )
        .eq("user_id", loadUserId)
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
    }
    if (initial) {
      setEmail(initial.email);
      setRole(initial.role);
      setFirstName(initial.fields.firstName);
      setLastName(initial.fields.lastName);
      setPronouns(initial.fields.pronouns);
      setState(initial.fields.state);
      setDistrict(initial.fields.district);
    }
  }, [open, loadUserId, initial]);

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setPronouns("");
    setState("");
    setDistrict("");
    setRole(initial?.role ?? "member");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Email/name/role are validated whenever the email is editable (add or a
    // not-yet-created placeholder); a committed placeholder edit only needs a
    // name, since the server action re-validates the rest anyway.
    const validationError = emailDisabled
      ? !firstName.trim() && !lastName.trim()
        ? "A first or last name is required."
        : null
      : validatePlaceholderFields(email, firstName, lastName, role);
    if (validationError) {
      setError(validationError);
      return;
    }

    onStage({
      email: email.trim(),
      role,
      fields: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        pronouns: pronouns.trim(),
        state,
        district,
      },
    });
    handleOpenChange(false);
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
              ? "Update this placeholder teammate's details. Changes are saved when you save the team."
              : "Add someone who hasn't signed up yet. They can claim this account later by signing up with the same email. Added when you save the team."}
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
                disabled={emailDisabled}
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
            {showRole && (
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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoadingProfile}>
                {isEdit ? "Save changes" : "Add teammate"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
