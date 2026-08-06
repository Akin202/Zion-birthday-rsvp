// TODO(claude-code): replace every function body with real Supabase queries.
// Signatures must not change — components depend on them.

import { RsvpRecord, RsvpStats, calculateHeadcount } from "../types/rsvp";
import { MOCK_RSVPS } from "./mock-data";

// In-memory state store initialized with deep copy of MOCK_RSVPS
let store: RsvpRecord[] = [...MOCK_RSVPS];

const simulateDelay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getAllRsvps(): Promise<RsvpRecord[]> {
  await simulateDelay();
  return [...store];
}

export async function getRsvpStats(): Promise<RsvpStats> {
  await simulateDelay();

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

export async function searchRsvpsByName(q: string): Promise<RsvpRecord[]> {
  await simulateDelay(150);
  const trimmed = q.trim().toLowerCase();
  if (!trimmed) return [...store];

  return store.filter(
    (r) =>
      r.guestFullName.toLowerCase().includes(trimmed) ||
      (r.plusOneName && r.plusOneName.toLowerCase().includes(trimmed)) ||
      (r.email && r.email.toLowerCase().includes(trimmed)) ||
      (r.phone && r.phone.includes(trimmed))
  );
}

export async function setCheckedIn(
  id: string,
  checkedIn: boolean,
  actual?: number
): Promise<void> {
  await simulateDelay(100);
  store = store.map((r) => {
    if (r.id === id) {
      const now = new Date().toISOString();
      return {
        ...r,
        checkedIn,
        checkedInAt: checkedIn ? now : null,
        actualHeadcount: checkedIn ? (actual ?? r.totalHeadcount) : null,
        updatedAt: now,
      };
    }
    return r;
  });
}

export async function updateRsvp(
  id: string,
  patch: Partial<RsvpRecord>
): Promise<void> {
  await simulateDelay(150);
  store = store.map((r) => {
    if (r.id === id) {
      const updated = {
        ...r,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      updated.totalHeadcount = calculateHeadcount(updated);
      return updated;
    }
    return r;
  });
}
