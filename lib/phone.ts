/**
 * Phone number helper for Nigerian formats.
 * Converts 080..., 23480..., +23480... to standardized +234... format.
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading plus
  let cleaned = phone.trim().replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+234")) {
    return cleaned;
  }

  if (cleaned.startsWith("234")) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith("0") && cleaned.length >= 10) {
    return `+234${cleaned.slice(1)}`;
  }

  // Fallback if it's 10 digits starting with 7, 8, or 9
  if (/^[789]\d{9}$/.test(cleaned)) {
    return `+234${cleaned}`;
  }

  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

export function isValidNigerianPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Valid Nigerian number format: +234 followed by 10 digits (usually starting with 7, 8, or 9)
  return /^\+234[789]\d{9}$/.test(normalized);
}
