import { describe, expect, test } from 'vitest';
import { escapeCsvCell, generateChildrenCsv, generateRsvpCsv } from '../lib/csv-export';
import { calculateHeadcount, type RsvpRecord } from '../types/rsvp';

function record(overrides: Partial<RsvpRecord> = {}): RsvpRecord {
  const values = {
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
    ...overrides,
  } as RsvpRecord;

  return {
    id: 'rsvp-001',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    totalHeadcount: calculateHeadcount(values),
    checkedIn: false,
    checkedInAt: null,
    actualHeadcount: null,
    ...values,
    ...overrides,
  };
}

/** Splits a CSV row honouring RFC 4180 quoting. */
function parseRow(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

describe('escapeCsvCell', () => {
  test('wraps plain values in quotes', () => {
    expect(escapeCsvCell('hello')).toBe('"hello"');
  });

  test('doubles embedded quotes so the cell survives a round trip', () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(parseRow(escapeCsvCell('say "hi"'))[0]).toBe('say "hi"');
  });

  test('keeps a comma inside a single cell', () => {
    expect(parseRow(escapeCsvCell('no nuts, vegetarian'))).toHaveLength(1);
  });

  test('renders null and undefined as an empty cell', () => {
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
  });
});

describe('generateRsvpCsv', () => {
  test('emits a header plus one row per RSVP', () => {
    const csv = generateRsvpCsv([record(), record({ id: 'rsvp-002' })]);
    expect(csv.split('\n')).toHaveLength(3);
  });

  test('counts the plus-one as a second adult', () => {
    const csv = generateRsvpCsv([
      record({ hasPlusOne: true, plusOneName: 'Funmi Adebayo' }),
    ]);
    const cells = parseRow(csv.split('\n')[1]);

    expect(cells[4]).toBe('2'); // Adults
    expect(cells[5]).toBe('Funmi Adebayo'); // Plus One Name
  });

  test('formats children as a readable age/gender string', () => {
    const csv = generateRsvpCsv([
      record({
        children: [
          { id: 'c1', age: 6, gender: 'female' },
          { id: 'c2', age: 8, gender: 'male' },
          { id: 'c3', age: 4, gender: 'female' },
        ],
      }),
    ]);
    const cells = parseRow(csv.split('\n')[1]);

    expect(cells[6]).toBe('3'); // Children Count
    expect(cells[7]).toBe('6F, 8M, 4F'); // Children Details
  });

  test('zeroes adults and nannies for a declined RSVP', () => {
    const csv = generateRsvpCsv([
      record({ isAttending: false, hasNanny: true, nannyCount: 2 }),
    ]);
    const cells = parseRow(csv.split('\n')[1]);

    expect(cells[3]).toBe('No'); // Attending
    expect(cells[4]).toBe('0'); // Adults
    expect(cells[8]).toBe('0'); // Nannies
    expect(cells[9]).toBe('0'); // Total Headcount
  });

  test('keeps a comma-containing dietary note in one cell', () => {
    const csv = generateRsvpCsv([record({ dietaryNotes: 'no nuts, halal' })]);
    const cells = parseRow(csv.split('\n')[1]);

    expect(cells).toHaveLength(13);
    expect(cells[10]).toBe('no nuts, halal');
  });

  test('totals reconcile with calculateHeadcount across a mixed list', () => {
    const rsvps = [
      record({ id: 'a', hasPlusOne: true, plusOneName: 'Funmi' }),
      record({ id: 'b', children: [{ id: 'c1', age: 5, gender: 'male' }] }),
      record({ id: 'c', hasNanny: true, nannyCount: 2 }),
      record({ id: 'd', isAttending: false }),
    ];

    const csvTotal = generateRsvpCsv(rsvps)
      .split('\n')
      .slice(1)
      .reduce((sum, row) => sum + Number(parseRow(row)[9]), 0);

    const expected = rsvps.reduce((sum, r) => sum + calculateHeadcount(r), 0);

    expect(csvTotal).toBe(expected);
    expect(csvTotal).toBe(2 + 2 + 3 + 0);
  });
});

describe('generateChildrenCsv', () => {
  test('emits one row per child, flattened across guests', () => {
    const csv = generateChildrenCsv([
      record({
        id: 'a',
        children: [
          { id: 'c1', age: 6, gender: 'female' },
          { id: 'c2', age: 8, gender: 'male' },
        ],
      }),
      record({ id: 'b', children: [{ id: 'c3', age: 3, gender: 'male' }] }),
    ]);

    expect(csv.split('\n')).toHaveLength(4); // header + 3 children
  });

  test('labels gender in words for the party-bag planner', () => {
    const csv = generateChildrenCsv([
      record({ children: [{ id: 'c1', age: 6, gender: 'female' }] }),
    ]);
    const cells = parseRow(csv.split('\n')[1]);

    expect(cells[3]).toBe('6');
    expect(cells[4]).toBe('Girl');
  });

  test('excludes children of guests who declined', () => {
    const csv = generateChildrenCsv([
      record({ isAttending: false, children: [{ id: 'c1', age: 6, gender: 'female' }] }),
    ]);

    expect(csv.split('\n')).toHaveLength(1); // header only
  });

  test('returns just the header when nobody brings children', () => {
    expect(generateChildrenCsv([record()]).split('\n')).toHaveLength(1);
  });
});
