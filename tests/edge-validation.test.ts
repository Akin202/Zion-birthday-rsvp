import { describe, expect, test } from 'vitest';
import {
  isValidNigerianPhone as clientIsValid,
  normalizePhone as clientNormalize,
} from '../lib/phone';
import { rsvpFormSchema } from '../lib/rsvpSchema';
import {
  isValidNigerianPhone as edgeIsValid,
  normalizePhone as edgeNormalize,
  validateSubmission,
} from '../supabase/functions/_shared/validation';

/**
 * The Edge Function re-derives validation instead of importing lib/, because it
 * must stay dependency-free (see the header of _shared/validation.ts). That
 * duplication is a drift risk, so these tests pin the two implementations
 * together. If one changes and the other doesn't, this file fails.
 */

const PHONE_INPUTS = [
  '08012345678',
  '2348012345678',
  '+2348012345678',
  '080 1234 5678',
  '0801-234-5678',
  '8012345678',
  '7012345678',
  '9012345678',
  '06012345678',
  '0801234567',
  '+14155550123',
  'not-a-phone',
  '',
];

describe('phone helpers stay in step across client and edge', () => {
  test.each(PHONE_INPUTS)('normalizePhone agrees for %j', (input) => {
    expect(edgeNormalize(input)).toBe(clientNormalize(input));
  });

  test.each(PHONE_INPUTS)('isValidNigerianPhone agrees for %j', (input) => {
    expect(edgeIsValid(input)).toBe(clientIsValid(input));
  });
});

const base = {
  guestFullName: 'Akinola Adebayo',
  email: 'akin@example.com',
  phone: '08012345678',
  isAttending: true,
  hasPlusOne: false,
  plusOneName: '',
  children: [],
  hasNanny: false,
  nannyCount: 0,
  dietaryNotes: '',
  messageToCelebrant: '',
};

const CASES: Array<[string, Record<string, unknown>]> = [
  ['a minimal valid submission', base],
  ['a single-word name', { ...base, guestFullName: 'Akinola' }],
  ['a name that is too short', { ...base, guestFullName: 'Ak' }],
  ['a malformed email', { ...base, email: 'nope' }],
  ['a non-Nigerian phone', { ...base, phone: '+14155550123' }],
  ['a plus-one with no name', { ...base, hasPlusOne: true, plusOneName: '' }],
  ['a plus-one with a name', { ...base, hasPlusOne: true, plusOneName: 'Funmi Adebayo' }],
  ['hasNanny with a zero count', { ...base, hasNanny: true, nannyCount: 0 }],
  ['hasNanny with a valid count', { ...base, hasNanny: true, nannyCount: 2 }],
  ['a nanny count above the cap', { ...base, hasNanny: true, nannyCount: 6 }],
  ['a child above the age cap', { ...base, children: [{ id: 'c', age: 18, gender: 'male' }] }],
  ['a child with a negative age', { ...base, children: [{ id: 'c', age: -1, gender: 'male' }] }],
  ['an unknown gender', { ...base, children: [{ id: 'c', age: 6, gender: 'other' }] }],
  ['a valid child', { ...base, children: [{ id: 'c', age: 6, gender: 'female' }] }],
  ['a 300-character message', { ...base, messageToCelebrant: 'a'.repeat(300) }],
  ['a 301-character message', { ...base, messageToCelebrant: 'a'.repeat(301) }],
  ['a declining guest', { ...base, isAttending: false }],
  [
    'a declining guest who still ticked plus-one',
    { ...base, isAttending: false, hasPlusOne: true, plusOneName: '' },
  ],
];

describe('the edge validator accepts and rejects the same inputs as the form schema', () => {
  test.each(CASES)('%s', (_label, input) => {
    expect(validateSubmission(input).ok).toBe(rsvpFormSchema.safeParse(input).success);
  });
});

describe('validateSubmission normalisation', () => {
  test('normalises the phone to +234 before it reaches the database', () => {
    const result = validateSubmission(base);
    expect(result.ok && result.value.phone).toBe('+2348012345678');
  });

  test('lowercases and trims the email so duplicate detection is reliable', () => {
    const result = validateSubmission({ ...base, email: '  AKIN@Example.COM  ' });
    expect(result.ok && result.value.email).toBe('akin@example.com');
  });

  test('a declining guest cannot smuggle in children, a plus-one, or a nanny', () => {
    const result = validateSubmission({
      ...base,
      isAttending: false,
      hasPlusOne: true,
      plusOneName: 'Funmi Adebayo',
      children: [{ id: 'c1', age: 6, gender: 'female' }],
      hasNanny: true,
      nannyCount: 3,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.isAttending).toBe(false);
    expect(result.value.hasPlusOne).toBe(false);
    expect(result.value.plusOneName).toBe('');
    expect(result.value.children).toEqual([]);
    expect(result.value.hasNanny).toBe(false);
    expect(result.value.nannyCount).toBe(0);
  });

  test('caps the children array so the UI stepper is not the only limit', () => {
    const tooMany = Array.from({ length: 11 }, (_, i) => ({ id: `c${i}`, age: 5, gender: 'male' }));
    expect(validateSubmission({ ...base, children: tooMany }).ok).toBe(false);
  });

  test('rejects a non-object body without throwing', () => {
    expect(validateSubmission(null).ok).toBe(false);
    expect(validateSubmission('a string').ok).toBe(false);
    expect(validateSubmission(42).ok).toBe(false);
  });

  test('reports the offending child by index', () => {
    const result = validateSubmission({
      ...base,
      children: [
        { id: 'c1', age: 6, gender: 'female' },
        { id: 'c2', age: 40, gender: 'male' },
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((i) => i.path === 'children.1.age')).toBe(true);
  });

  test('a missing isAttending is rejected rather than defaulted', () => {
    const { isAttending: _omitted, ...withoutAttending } = base;
    expect(validateSubmission(withoutAttending).ok).toBe(false);
  });
});
