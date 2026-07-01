export const MIN_PASSWORD_LENGTH = 8;

/**
 * Returns a human-readable error if the password fails policy, or null if it
 * passes. Must stay in sync with `password_requirements =
 * "lower_upper_letters_digits"` in supabase/config.toml.
 */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include a number.";
  }
  return null;
}
