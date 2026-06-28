import { ROLE_LABELS } from "@/lib/teams";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePlaceholderFields(
  email: string,
  firstName: string,
  lastName: string,
  role: string,
): string | null {
  if (!email.trim()) return "Email is required.";
  if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address.";
  // A nameless placeholder can't be found in delegation search later.
  if (!firstName.trim() && !lastName.trim())
    return "A first or last name is required.";
  if (!(role in ROLE_LABELS)) return "Invalid team role.";
  return null;
}
