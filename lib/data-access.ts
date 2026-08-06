/**
 * The only seam between the UI and the database.
 *
 * Every component calls these functions and nothing else. The signatures are a
 * contract — components depend on them, so change bodies freely but not shapes.
 *
 * Reads run as the signed-in admin (Supabase Auth `authenticated` role) and are
 * filtered by RLS. There is no service_role key in the browser.
 */

import { supabase } from "./supabase";
import {
  calculateHeadcount,
  type ChildEntry,
  type RsvpRecord,
  type RsvpStats,
} from "../types/rsvp";

/** Shape of a row as it comes back from Postgres (snake_case). */
interface RsvpRow {
  id: string;
  created_at: string;
  updated_at: string;
  guest_full_name: string;
  email: string;
  phone: string;
  is_attending: boolean;
  has_plus_one: boolean;
  plus_one_name: string | null;
  children_count: number;
  has_nanny: boolean;
  nanny_count: number;
  dietary_notes: string | null;
  message_to_celebrant: string | null;
  total_headcount: number;
  checked_in: boolean;
  checked_in_at: string | null;
  actual_headcount: number | null;
  rsvp_children?: { id: string; age: number; gender: "male" | "female" }[];
}

/**
 * Selected columns. Deliberately does NOT include edit_token — that is a
 * capability for the owning guest, and must never travel in a list response.
 */
const RSVP_COLUMNS = `
  id, created_at, updated_at,
  guest_full_name, email, phone,
  is_attending, has_plus_one, plus_one_name,
  children_count, has_nanny, nanny_count,
  dietary_notes, message_to_celebrant,
  total_headcount, checked_in, checked_in_at, actual_headcount,
  rsvp_children ( id, age, gender )
`;

function toRecord(row: RsvpRow): RsvpRecord {
  const children: ChildEntry[] = (row.rsvp_children ?? [])
    .map((c) => ({ id: c.id, age: c.age, gender: c.gender }))
    // Stable order so the admin UI does not reshuffle rows between fetches.
    .sort((a, b) => a.age - b.age || a.id.localeCompare(b.id));

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    guestFullName: row.guest_full_name,
    email: row.email,
    phone: row.phone,
    isAttending: row.is_attending,
    hasPlusOne: row.has_plus_one,
    plusOneName: row.plus_one_name ?? "",
    children,
    hasNanny: row.has_nanny,
    nannyCount: row.nanny_count,
    dietaryNotes: row.dietary_notes ?? "",
    messageToCelebrant: row.message_to_celebrant ?? "",
    totalHeadcount: row.total_headcount,
    checkedIn: row.checked_in,
    checkedInAt: row.checked_in_at,
    actualHeadcount: row.actual_headcount,
  };
}

export async function getAllRsvps(): Promise<RsvpRecord[]> {
  const { data, error } = await supabase
    .from("rsvps")
    .select(RSVP_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data-access] getAllRsvps failed:", error);
    throw new Error("Could not load the guest list.");
  }

  return (data as unknown as RsvpRow[]).map(toRecord);
}

export async function getRsvpStats(): Promise<RsvpStats> {
  // Derived from the same rows the guest list renders, so the dashboard and the
  // table can never disagree.
  const records = await getAllRsvps();

  const attending = records.filter((r) => r.isAttending);

  const ageMap: Record<number, number> = {};
  for (let age = 0; age <= 17; age++) ageMap[age] = 0;

  let maleChildren = 0;
  let femaleChildren = 0;
  let totalExpectedHeadcount = 0;
  let adultsCount = 0;
  let childrenCount = 0;
  let nanniesCount = 0;
  let checkedInCount = 0;
  let checkedInExpectedHeadcount = 0;

  const dietaryRequirements: RsvpStats["dietaryRequirements"] = [];
  const messagesToCelebrant: RsvpStats["messagesToCelebrant"] = [];

  for (const r of records) {
    if (r.isAttending) {
      totalExpectedHeadcount += r.totalHeadcount;
      adultsCount += 1 + (r.hasPlusOne ? 1 : 0);
      childrenCount += r.children.length;
      nanniesCount += r.hasNanny ? r.nannyCount : 0;

      for (const c of r.children) {
        if (c.age >= 0 && c.age <= 17) ageMap[c.age] += 1;
        if (c.gender === "male") maleChildren += 1;
        else femaleChildren += 1;
      }

      if (r.dietaryNotes.trim()) {
        dietaryRequirements.push({
          id: r.id,
          guestName: r.guestFullName,
          notes: r.dietaryNotes.trim(),
        });
      }
    }

    if (r.checkedIn) {
      checkedInCount += 1;
      checkedInExpectedHeadcount += r.actualHeadcount ?? r.totalHeadcount;
    }

    // Messages come from declining guests too — they're often the warmest ones.
    if (r.messageToCelebrant.trim()) {
      messagesToCelebrant.push({
        id: r.id,
        guestName: r.guestFullName,
        message: r.messageToCelebrant.trim(),
        date: r.createdAt,
      });
    }
  }

  return {
    totalResponses: records.length,
    attendingCount: attending.length,
    notAttendingCount: records.length - attending.length,
    totalExpectedHeadcount,
    adultsCount,
    childrenCount,
    nanniesCount,
    checkedInCount,
    checkedInExpectedHeadcount,
    childrenByAge: Object.entries(ageMap).map(([age, count]) => ({
      age: Number(age),
      count,
    })),
    childrenByGender: [
      { gender: "male", count: maleChildren },
      { gender: "female", count: femaleChildren },
    ],
    dietaryRequirements,
    messagesToCelebrant,
  };
}

export async function searchRsvpsByName(q: string): Promise<RsvpRecord[]> {
  const trimmed = q.trim().toLowerCase();

  if (!trimmed) return getAllRsvps();

  // guest_name_lower is a stored generated column with its own index, so this
  // stays fast enough for the door tool even on a weak connection.
  const escaped = trimmed.replace(/[%_]/g, (m) => `\\${m}`);

  const { data, error } = await supabase
    .from("rsvps")
    .select(RSVP_COLUMNS)
    .like("guest_name_lower", `%${escaped}%`)
    .order("guest_name_lower", { ascending: true });

  if (error) {
    console.error("[data-access] searchRsvpsByName failed:", error);
    throw new Error("Could not search the guest list.");
  }

  return (data as unknown as RsvpRow[]).map(toRecord);
}

export async function setCheckedIn(
  id: string,
  checkedIn: boolean,
  actual?: number,
): Promise<void> {
  const { error } = await supabase
    .from("rsvps")
    .update({
      checked_in: checkedIn,
      // The schema constraint requires the timestamp and the flag to agree.
      checked_in_at: checkedIn ? new Date().toISOString() : null,
      actual_headcount: checkedIn ? (actual ?? null) : null,
    })
    .eq("id", id);

  if (error) {
    console.error("[data-access] setCheckedIn failed:", error);
    throw new Error("Could not save the check-in.");
  }
}

export async function updateRsvp(
  id: string,
  patch: Partial<RsvpRecord>,
): Promise<void> {
  // Recompute the headcount from whatever the patch leaves in place. The admin
  // edit modal can change child counts, and the stored total must follow.
  const { data: current, error: readError } = await supabase
    .from("rsvps")
    .select(RSVP_COLUMNS)
    .eq("id", id)
    .single();

  if (readError) {
    console.error("[data-access] updateRsvp read failed:", readError);
    throw new Error("Could not load that guest.");
  }

  const merged = { ...toRecord(current as unknown as RsvpRow), ...patch };

  const { error } = await supabase
    .from("rsvps")
    .update({
      guest_full_name: merged.guestFullName,
      email: merged.email,
      phone: merged.phone,
      is_attending: merged.isAttending,
      has_plus_one: merged.hasPlusOne,
      plus_one_name: merged.hasPlusOne ? merged.plusOneName : null,
      children_count: merged.children.length,
      has_nanny: merged.hasNanny,
      nanny_count: merged.hasNanny ? merged.nannyCount : 0,
      dietary_notes: merged.dietaryNotes || null,
      message_to_celebrant: merged.messageToCelebrant || null,
      total_headcount: calculateHeadcount(merged),
    })
    .eq("id", id);

  if (error) {
    console.error("[data-access] updateRsvp failed:", error);
    throw new Error("Could not save those changes.");
  }

  // TODO(claude-code): the admin edit modal cannot yet change individual child
  // rows — only the parent record. Wire child-row editing in Phase 2 alongside
  // the guest edit flow, which already replaces children wholesale.
}
