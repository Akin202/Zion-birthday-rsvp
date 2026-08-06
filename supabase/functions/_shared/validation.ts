/**
 * Server-side validation for RSVP submissions.
 *
 * Deliberately dependency-free. Two reasons:
 *   1. Cold start. This function exists to make one RPC call; pulling zod and
 *      the full supabase-js client in to do it is a poor trade on a path a
 *      guest waits on over Nigerian mobile data.
 *   2. Defence in depth is the database's job. Age ranges, gender values, nanny
 *      counts, message length, email and phone format, and the plus-one rule
 *      are all CHECK constraints in migration 1, so they hold no matter which
 *      path writes the row. What's here is the friendly first line of defence,
 *      not the only one.
 *
 * The phone helpers mirror lib/phone.ts exactly, and tests/edge-validation.test.ts
 * pins them together — if one changes and the other doesn't, that test fails.
 */

// --- phone ------------------------------------------------------------------

/** Mirror of normalizePhone() in lib/phone.ts. */
export function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+234')) return cleaned;
  if (cleaned.startsWith('234')) return `+${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length >= 10) return `+234${cleaned.slice(1)}`;
  if (/^[789]\d{9}$/.test(cleaned)) return `+234${cleaned}`;

  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/** Mirror of isValidNigerianPhone() in lib/phone.ts. */
export function isValidNigerianPhone(phone: string): boolean {
  return /^\+234[789]\d{9}$/.test(normalizePhone(phone));
}

// --- types ------------------------------------------------------------------

export interface ChildInput {
  id: string;
  age: number;
  gender: 'male' | 'female';
}

export interface RsvpSubmission {
  guestFullName: string;
  email: string;
  phone: string;
  isAttending: boolean;
  hasPlusOne: boolean;
  plusOneName: string;
  children: ChildInput[];
  hasNanny: boolean;
  nannyCount: number;
  dietaryNotes: string;
  messageToCelebrant: string;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; value: RsvpSubmission }
  | { ok: false; issues: ValidationIssue[] };

// --- helpers ----------------------------------------------------------------

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const MAX_CHILDREN = 10;
const MAX_NANNIES = 5;
const MAX_MESSAGE = 300;
const MAX_DIETARY = 1000;

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asBool(v: unknown): boolean {
  return v === true;
}

function asInt(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : 0;
}

// --- validation -------------------------------------------------------------

export function validateSubmission(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (typeof input !== 'object' || input === null) {
    return { ok: false, issues: [{ path: '', message: 'Invalid request body.' }] };
  }

  const raw = input as Record<string, unknown>;

  const guestFullName = asString(raw.guestFullName);
  const email = asString(raw.email).toLowerCase();
  const phoneInput = asString(raw.phone);
  const isAttending = asBool(raw.isAttending);
  const hasPlusOne = isAttending && asBool(raw.hasPlusOne);
  const hasNanny = isAttending && asBool(raw.hasNanny);
  const plusOneName = asString(raw.plusOneName);
  const dietaryNotes = asString(raw.dietaryNotes);
  const messageToCelebrant = asString(raw.messageToCelebrant);

  if (guestFullName.length < 3) {
    issues.push({ path: 'guestFullName', message: 'Please enter your full name.' });
  } else if (guestFullName.split(/\s+/).length < 2) {
    issues.push({ path: 'guestFullName', message: 'Please enter both a first and last name.' });
  }

  if (!EMAIL_RE.test(email)) {
    issues.push({ path: 'email', message: 'Please enter a valid email address.' });
  }

  if (!isValidNigerianPhone(phoneInput)) {
    issues.push({ path: 'phone', message: 'Please enter a valid Nigerian phone number.' });
  }

  if (typeof raw.isAttending !== 'boolean') {
    issues.push({ path: 'isAttending', message: 'Please tell us whether you can make it.' });
  }

  if (hasPlusOne && plusOneName.length < 2) {
    issues.push({ path: 'plusOneName', message: "Please enter your plus-one's name." });
  }

  // Everything attendance-related collapses when declining, so a declining
  // guest cannot smuggle in children or a nanny.
  const rawChildren = isAttending && Array.isArray(raw.children) ? raw.children : [];

  if (rawChildren.length > MAX_CHILDREN) {
    issues.push({
      path: 'children',
      message: `Please list no more than ${MAX_CHILDREN} children.`,
    });
  }

  const children: ChildInput[] = [];
  rawChildren.slice(0, MAX_CHILDREN).forEach((entry, index) => {
    const child = (typeof entry === 'object' && entry !== null ? entry : {}) as Record<
      string,
      unknown
    >;
    const age = asInt(child.age);
    const gender = asString(child.gender);

    if (age < 0 || age > 17) {
      issues.push({ path: `children.${index}.age`, message: 'Age must be between 0 and 17.' });
    }
    if (gender !== 'male' && gender !== 'female') {
      issues.push({ path: `children.${index}.gender`, message: 'Please choose a gender.' });
    }

    children.push({ id: asString(child.id) || `c${index}`, age, gender: gender as 'male' | 'female' });
  });

  const nannyCount = hasNanny ? asInt(raw.nannyCount) : 0;
  if (hasNanny && (nannyCount < 1 || nannyCount > MAX_NANNIES)) {
    issues.push({
      path: 'nannyCount',
      message: `Please enter between 1 and ${MAX_NANNIES} nannies.`,
    });
  }

  if (messageToCelebrant.length > MAX_MESSAGE) {
    issues.push({
      path: 'messageToCelebrant',
      message: `Please keep your message under ${MAX_MESSAGE} characters.`,
    });
  }

  if (dietaryNotes.length > MAX_DIETARY) {
    issues.push({ path: 'dietaryNotes', message: 'That note is too long.' });
  }

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    value: {
      guestFullName,
      email,
      phone: normalizePhone(phoneInput),
      isAttending,
      hasPlusOne,
      plusOneName: hasPlusOne ? plusOneName : '',
      children,
      hasNanny,
      nannyCount,
      dietaryNotes,
      messageToCelebrant,
    },
  };
}
