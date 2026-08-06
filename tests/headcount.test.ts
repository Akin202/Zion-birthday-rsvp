import { describe, expect, test } from 'vitest';
import { calculateHeadcount, type RsvpFormValues } from '../types/rsvp';

const base: RsvpFormValues = {
  guestFullName: 'Akinola Adebayo',
  email: 'akin@example.com',
  phone: '+2348012345678',
  isAttending: true,
  hasPlusOne: false,
  plusOneName: '',
  children: [],
  hasNanny: false,
  nannyCount: 0,
  dietaryNotes: '',
  messageToCelebrant: '',
};

const child = (age: number, gender: 'male' | 'female') => ({
  id: `c-${age}-${gender}`,
  age,
  gender,
});

describe('calculateHeadcount', () => {
  test('a lone attending guest counts as 1', () => {
    expect(calculateHeadcount(base)).toBe(1);
  });

  test('returns 0 when not attending, regardless of other fields', () => {
    const declined: RsvpFormValues = {
      ...base,
      isAttending: false,
      hasPlusOne: true,
      plusOneName: 'Funmi Adebayo',
      children: [child(7, 'male'), child(5, 'female')],
      hasNanny: true,
      nannyCount: 2,
    };

    expect(calculateHeadcount(declined)).toBe(0);
  });

  test('adds the plus-one', () => {
    expect(calculateHeadcount({ ...base, hasPlusOne: true, plusOneName: 'Funmi' })).toBe(2);
  });

  test('adds one per child', () => {
    const withChildren = {
      ...base,
      children: [child(7, 'male'), child(5, 'female'), child(2, 'male')],
    };

    expect(calculateHeadcount(withChildren)).toBe(4);
  });

  test('adds nannyCount only when hasNanny is true', () => {
    expect(calculateHeadcount({ ...base, hasNanny: true, nannyCount: 2 })).toBe(3);
    expect(calculateHeadcount({ ...base, hasNanny: false, nannyCount: 2 })).toBe(1);
  });

  test('sums guest, plus-one, children and nannies together', () => {
    const full: RsvpFormValues = {
      ...base,
      hasPlusOne: true,
      plusOneName: 'Funmi Adebayo',
      children: [child(7, 'male'), child(5, 'female'), child(2, 'male')],
      hasNanny: true,
      nannyCount: 1,
    };

    // 1 guest + 1 plus-one + 3 children + 1 nanny
    expect(calculateHeadcount(full)).toBe(6);
  });

  test('does not mutate the input', () => {
    const input: RsvpFormValues = { ...base, children: [child(4, 'female')] };
    const snapshot = structuredClone(input);

    calculateHeadcount(input);

    expect(input).toEqual(snapshot);
  });
});
