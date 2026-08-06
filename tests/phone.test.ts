import { describe, expect, test } from 'vitest';
import { isValidNigerianPhone, normalizePhone } from '../lib/phone';

describe('normalizePhone', () => {
  test('converts a local 0-prefixed number to +234 format', () => {
    expect(normalizePhone('08012345678')).toBe('+2348012345678');
  });

  test('converts a 234-prefixed number by adding the plus', () => {
    expect(normalizePhone('2348012345678')).toBe('+2348012345678');
  });

  test('leaves an already-normalised +234 number unchanged', () => {
    expect(normalizePhone('+2348012345678')).toBe('+2348012345678');
  });

  test('strips spaces, dashes and parentheses before normalising', () => {
    expect(normalizePhone('080 1234 5678')).toBe('+2348012345678');
    expect(normalizePhone('0801-234-5678')).toBe('+2348012345678');
    expect(normalizePhone('(0801) 234 5678')).toBe('+2348012345678');
  });

  test('trims surrounding whitespace', () => {
    expect(normalizePhone('  08012345678  ')).toBe('+2348012345678');
  });

  test('prefixes a bare 10-digit number starting 7, 8 or 9', () => {
    expect(normalizePhone('8012345678')).toBe('+2348012345678');
    expect(normalizePhone('7012345678')).toBe('+2347012345678');
    expect(normalizePhone('9012345678')).toBe('+2349012345678');
  });

  test('all three accepted input formats converge on the same output', () => {
    const results = new Set([
      normalizePhone('08012345678'),
      normalizePhone('2348012345678'),
      normalizePhone('+2348012345678'),
    ]);

    expect(results.size).toBe(1);
    expect([...results][0]).toBe('+2348012345678');
  });
});

describe('isValidNigerianPhone', () => {
  test.each([
    '08012345678',
    '07012345678',
    '09012345678',
    '+2348012345678',
    '2348012345678',
    '0801 234 5678',
  ])('accepts %s', (input) => {
    expect(isValidNigerianPhone(input)).toBe(true);
  });

  test.each([
    ['', 'empty string'],
    ['0801234567', 'too short'],
    ['080123456789', 'too long'],
    ['06012345678', 'invalid network prefix 6'],
    ['+14155550123', 'non-Nigerian country code'],
    ['not-a-phone', 'non-numeric'],
  ])('rejects %s (%s)', (input) => {
    expect(isValidNigerianPhone(input)).toBe(false);
  });
});
