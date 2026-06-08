/**
 * Build a 1–2 character avatar label for a user.
 *
 * Prefers the first name (first letter of up to the first two words), then falls
 * back to the email local-part, and finally to "?". The user object has no
 * dedicated name/avatar fields, so this is the canonical source of initials.
 */
export function getInitials(firstName?: string, email?: string): string {
  const name = firstName?.trim();
  if (name) {
    const letters = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]);
    if (letters.length) return letters.join('').toUpperCase();
  }

  const local = email?.split('@')[0]?.trim();
  if (local) {
    const parts = local.split(/[^a-zA-Z]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  }

  return '?';
}
