// Supabase-backed data access layer.
// Function signatures are unchanged — components depend on them.

import { RsvpRecord, RsvpFormValues, RsvpStats, SubmissionState, calculateHeadcount } from "../types/rsvp";
import { RsvpRow, fromDbRecord, toDbRecord } from "../types/db-types";
import { supabase } from "./supabase";

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

export async function getAllRsvps(): Promise<RsvpRecord[]> {
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllRsvps error:", error);
    throw new Error(error.message);
  }

  return (data as RsvpRow[]).map(fromDbRecord);
}

export async function getRsvpStats(): Promise<RsvpStats> {
  // Fetch all rows — the stats computation happens in JS to match existing
  // interface shape exactly.  For a birthday RSVP list the row count is small
  // enough that this is fine.
  const { data, error } = await supabase
    .from("rsvps")
    .select("*");

  if (error) {
    console.error("getRsvpStats error:", error);
    throw new Error(error.message);
  }

  const store = (data as RsvpRow[]).map(fromDbRecord);

  const totalResponses = store.length;
  const attendingList = store.filter((r) => r.isAttending);
  const attendingCount = attendingList.length;
  const notAttendingCount = store.filter((r) => !r.isAttending).length;

  let totalExpectedHeadcount = 0;
  let adultsCount = 0;
  let childrenCount = 0;
  let nanniesCount = 0;
  let checkedInCount = 0;
  let checkedInExpectedHeadcount = 0;

  const ageMap: Record<number, number> = {};
  for (let a = 0; a <= 17; a++) {
    ageMap[a] = 0;
  }

  let maleChildren = 0;
  let femaleChildren = 0;

  const dietaryRequirements: { id: string; guestName: string; notes: string }[] = [];
  const messagesToCelebrant: { id: string; guestName: string; message: string; date: string }[] = [];

  store.forEach((r) => {
    if (r.isAttending) {
      const h = calculateHeadcount(r);
      totalExpectedHeadcount += h;

      // Adults: primary guest (1) + plus-one (1 if hasPlusOne)
      adultsCount += 1 + (r.hasPlusOne ? 1 : 0);

      // Children
      childrenCount += r.children.length;
      r.children.forEach((c) => {
        if (c.age >= 0 && c.age <= 17) {
          ageMap[c.age] = (ageMap[c.age] || 0) + 1;
        }
        if (c.gender === "male") maleChildren++;
        if (c.gender === "female") femaleChildren++;
      });

      // Nannies
      nanniesCount += r.hasNanny ? r.nannyCount : 0;

      // Dietary notes
      if (r.dietaryNotes && r.dietaryNotes.trim()) {
        dietaryRequirements.push({
          id: r.id,
          guestName: r.guestFullName,
          notes: r.dietaryNotes.trim(),
        });
      }
    }

    if (r.checkedIn) {
      checkedInCount++;
      checkedInExpectedHeadcount += r.actualHeadcount ?? r.totalHeadcount;
    }

    // Messages (from both attending & non-attending)
    if (r.messageToCelebrant && r.messageToCelebrant.trim()) {
      messagesToCelebrant.push({
        id: r.id,
        guestName: r.guestFullName,
        message: r.messageToCelebrant.trim(),
        date: r.createdAt,
      });
    }
  });

  const childrenByAge = Object.keys(ageMap).map((ageStr) => ({
    age: parseInt(ageStr, 10),
    count: ageMap[parseInt(ageStr, 10)],
  }));

  const childrenByGender: { gender: "male" | "female"; count: number }[] = [
    { gender: "male", count: maleChildren },
    { gender: "female", count: femaleChildren },
  ];

  return {
    totalResponses,
    attendingCount,
    notAttendingCount,
    totalExpectedHeadcount,
    adultsCount,
    childrenCount,
    nanniesCount,
    checkedInCount,
    checkedInExpectedHeadcount,
    childrenByAge,
    childrenByGender,
    dietaryRequirements,
    messagesToCelebrant,
  };
}

// ---------------------------------------------------------------------------
// SEARCH
// ---------------------------------------------------------------------------

export async function searchRsvpsByName(q: string): Promise<RsvpRecord[]> {
  const trimmed = q.trim().toLowerCase();
  if (!trimmed) return getAllRsvps();

  // Use ilike for flexible text search across multiple columns
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .or(
      `guest_full_name.ilike.%${trimmed}%,` +
      `plus_one_name.ilike.%${trimmed}%,` +
      `email.ilike.%${trimmed}%,` +
      `phone.ilike.%${trimmed}%`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("searchRsvpsByName error:", error);
    throw new Error(error.message);
  }

  return (data as RsvpRow[]).map(fromDbRecord);
}

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------

/** Submit a new RSVP. Returns the submission state for the UI. */
export async function submitRsvp(
  values: RsvpFormValues
): Promise<SubmissionState> {
  const headcount = calculateHeadcount(values);

  const payload = {
    ...toDbRecord({
      ...values,
      totalHeadcount: headcount,
    } as RsvpRecord),
  };

  const { data, error } = await supabase
    .from("rsvps")
    .insert(payload)
    .select()
    .single();

  if (error) {
    // Unique constraint violation on email → duplicate RSVP
    if (error.code === "23505") {
      return { status: "duplicate" };
    }
    console.error("submitRsvp error:", error);
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    record: fromDbRecord(data as RsvpRow),
  };
}

export async function setCheckedIn(
  id: string,
  checkedIn: boolean,
  actual?: number
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("rsvps")
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? now : null,
      actual_headcount: checkedIn ? (actual ?? null) : null,
    })
    .eq("id", id);

  if (error) {
    console.error("setCheckedIn error:", error);
    throw new Error(error.message);
  }
}

export async function updateRsvp(
  id: string,
  patch: Partial<RsvpRecord>
): Promise<void> {
  // Recalculate headcount if attendance-related fields are being patched
  const dbPatch = toDbRecord(patch);

  // If enough fields are present to recalculate headcount, do so
  if (
    patch.isAttending !== undefined ||
    patch.hasPlusOne !== undefined ||
    patch.children !== undefined ||
    patch.hasNanny !== undefined ||
    patch.nannyCount !== undefined
  ) {
    // We need the full record to recalculate accurately
    const { data: current, error: fetchError } = await supabase
      .from("rsvps")
      .select("*")
      .eq("id", id)
      .single();

    if (!fetchError && current) {
      const merged = { ...fromDbRecord(current as RsvpRow), ...patch };
      dbPatch.total_headcount = calculateHeadcount(merged);
    }
  }

  const { error } = await supabase
    .from("rsvps")
    .update(dbPatch)
    .eq("id", id);

  if (error) {
    console.error("updateRsvp error:", error);
    throw new Error(error.message);
  }
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

/** Delete a single RSVP by its ID. */
export async function deleteRsvp(id: string): Promise<void> {
  const { error } = await supabase
    .from("rsvps")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteRsvp error:", error);
    throw new Error(error.message);
  }
}

/** Delete multiple RSVPs by their IDs. */
export async function deleteMultipleRsvps(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from("rsvps")
    .delete()
    .in("id", ids);

  if (error) {
    console.error("deleteMultipleRsvps error:", error);
    throw new Error(error.message);
  }
}

// ---------------------------------------------------------------------------
// REALTIME
// ---------------------------------------------------------------------------

/**
 * Subscribe to changes on the rsvps table.
 * Returns an unsubscribe function.
 */
export function subscribeToRsvps(
  callback: () => void
): () => void {
  const channel = supabase
    .channel("rsvps-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rsvps" },
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
