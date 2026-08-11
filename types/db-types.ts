/**
 * DB ↔ App type mapping utilities.
 *
 * The Supabase table uses snake_case columns while the front-end
 * uses camelCase interfaces. These helpers convert between the two
 * so the rest of the app never touches snake_case.
 */

import { RsvpRecord, ChildEntry } from "./rsvp";

/** Row shape coming back from Supabase `rsvps` table. */
export interface RsvpRow {
  id: string;
  guest_full_name: string;
  email: string;
  phone: string;
  is_attending: boolean;
  has_plus_one: boolean;
  plus_one_name: string;
  children: ChildEntry[];
  has_nanny: boolean;
  nanny_count: number;
  dietary_notes: string;
  message_to_celebrant: string;
  total_headcount: number;
  checked_in: boolean;
  checked_in_at: string | null;
  actual_headcount: number | null;
  created_at: string;
  updated_at: string;
}

/** Convert a Supabase row (snake_case) → front-end RsvpRecord (camelCase). */
export function fromDbRecord(row: RsvpRow): RsvpRecord {
  return {
    id: row.id,
    guestFullName: row.guest_full_name,
    email: row.email,
    phone: row.phone,
    isAttending: row.is_attending,
    hasPlusOne: row.has_plus_one,
    plusOneName: row.plus_one_name,
    children: row.children ?? [],
    hasNanny: row.has_nanny,
    nannyCount: row.nanny_count,
    dietaryNotes: row.dietary_notes,
    messageToCelebrant: row.message_to_celebrant,
    totalHeadcount: row.total_headcount,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
    actualHeadcount: row.actual_headcount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Convert a front-end RsvpRecord (camelCase) → Supabase insert/update payload (snake_case). */
export function toDbRecord(
  record: Partial<RsvpRecord>
): Record<string, unknown> {
  const map: Record<string, unknown> = {};

  if (record.guestFullName !== undefined)
    map.guest_full_name = record.guestFullName;
  if (record.email !== undefined) map.email = record.email;
  if (record.phone !== undefined) map.phone = record.phone;
  if (record.isAttending !== undefined) map.is_attending = record.isAttending;
  if (record.hasPlusOne !== undefined) map.has_plus_one = record.hasPlusOne;
  if (record.plusOneName !== undefined) map.plus_one_name = record.plusOneName;
  if (record.children !== undefined) map.children = record.children;
  if (record.hasNanny !== undefined) map.has_nanny = record.hasNanny;
  if (record.nannyCount !== undefined) map.nanny_count = record.nannyCount;
  if (record.dietaryNotes !== undefined)
    map.dietary_notes = record.dietaryNotes;
  if (record.messageToCelebrant !== undefined)
    map.message_to_celebrant = record.messageToCelebrant;
  if (record.totalHeadcount !== undefined)
    map.total_headcount = record.totalHeadcount;
  if (record.checkedIn !== undefined) map.checked_in = record.checkedIn;
  if (record.checkedInAt !== undefined) map.checked_in_at = record.checkedInAt;
  if (record.actualHeadcount !== undefined)
    map.actual_headcount = record.actualHeadcount;

  return map;
}
