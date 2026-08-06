export type Gender = "male" | "female";

export interface ChildEntry {
  id: string;          // client-side temp id
  age: number;         // 0-17
  gender: Gender;
}

export interface RsvpFormValues {
  guestFullName: string;
  email: string;
  phone: string;
  isAttending: boolean;
  hasPlusOne: boolean;
  plusOneName: string;
  children: ChildEntry[];
  hasNanny: boolean;
  nannyCount: number;
  dietaryNotes: string;
  messageToCelebrant: string;
}

export interface RsvpRecord extends RsvpFormValues {
  id: string;
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
  totalHeadcount: number;
  checkedIn: boolean;
  checkedInAt: string | null;
  actualHeadcount: number | null;
}

export type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; record: RsvpRecord }
  | { status: "duplicate" }
  | { status: "error"; message: string };

export interface RsvpStats {
  totalResponses: number;
  attendingCount: number;
  notAttendingCount: number;
  totalExpectedHeadcount: number;
  adultsCount: number; // including plus-ones
  childrenCount: number;
  nanniesCount: number;
  checkedInCount: number;
  checkedInExpectedHeadcount: number;
  childrenByAge: { age: number; count: number }[];
  childrenByGender: { gender: "male" | "female"; count: number }[];
  dietaryRequirements: { id: string; guestName: string; notes: string }[];
  messagesToCelebrant: { id: string; guestName: string; message: string; date: string }[];
}

export function calculateHeadcount(v: RsvpFormValues): number {
  if (!v.isAttending) return 0;
  return 1 + (v.hasPlusOne ? 1 : 0) + v.children.length + (v.hasNanny ? v.nannyCount : 0);
}
