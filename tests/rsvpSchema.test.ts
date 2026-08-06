import { describe, expect, test } from 'vitest';
import { rsvpFormSchema } from '../lib/rsvpSchema';

const valid = {
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

/** Returns the set of field paths that failed validation. */
function errorPaths(input: unknown): string[] {
  const result = rsvpFormSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((i) => i.path.join('.'));
}

describe('rsvpFormSchema', () => {
  test('accepts a minimal valid submission', () => {
    expect(rsvpFormSchema.safeParse(valid).success).toBe(true);
  });

  test('requires a full name of at least two words', () => {
    expect(errorPaths({ ...valid, guestFullName: 'Akinola' })).toContain('guestFullName');
    expect(errorPaths({ ...valid, guestFullName: 'Ak' })).toContain('guestFullName');
  });

  test('rejects a malformed email', () => {
    expect(errorPaths({ ...valid, email: 'not-an-email' })).toContain('email');
    expect(errorPaths({ ...valid, email: '' })).toContain('email');
  });

  test('rejects a non-Nigerian phone number', () => {
    expect(errorPaths({ ...valid, phone: '+14155550123' })).toContain('phone');
    expect(errorPaths({ ...valid, phone: '' })).toContain('phone');
  });

  test('requires a plus-one name when attending with a plus-one', () => {
    const paths = errorPaths({ ...valid, hasPlusOne: true, plusOneName: '' });
    expect(paths).toContain('plusOneName');
  });

  test('does not require a plus-one name when not attending', () => {
    const result = rsvpFormSchema.safeParse({
      ...valid,
      isAttending: false,
      hasPlusOne: true,
      plusOneName: '',
    });

    expect(result.success).toBe(true);
  });

  test('requires at least one nanny when hasNanny is true', () => {
    expect(errorPaths({ ...valid, hasNanny: true, nannyCount: 0 })).toContain('nannyCount');
    expect(rsvpFormSchema.safeParse({ ...valid, hasNanny: true, nannyCount: 1 }).success).toBe(
      true,
    );
  });

  test('caps nannyCount at 5', () => {
    expect(errorPaths({ ...valid, hasNanny: true, nannyCount: 6 })).toContain('nannyCount');
  });

  test('rejects a child outside the 0-17 age range', () => {
    const tooOld = errorPaths({
      ...valid,
      children: [{ id: 'c1', age: 18, gender: 'male' }],
    });
    expect(tooOld.join()).toContain('children');

    const negative = errorPaths({
      ...valid,
      children: [{ id: 'c1', age: -1, gender: 'male' }],
    });
    expect(negative.join()).toContain('children');
  });

  test('rejects an unknown gender value', () => {
    const paths = errorPaths({
      ...valid,
      children: [{ id: 'c1', age: 6, gender: 'other' }],
    });
    expect(paths.join()).toContain('children');
  });

  test('caps the celebrant message at 300 characters', () => {
    expect(
      errorPaths({ ...valid, messageToCelebrant: 'a'.repeat(301) }),
    ).toContain('messageToCelebrant');

    expect(
      rsvpFormSchema.safeParse({ ...valid, messageToCelebrant: 'a'.repeat(300) }).success,
    ).toBe(true);
  });
});
