/**
 * Client side of the RSVP edit path.
 *
 * Reads go straight to PostgREST because RLS makes that safe: the anon role can
 * SELECT exactly the one row whose edit_token matches the x-rsvp-edit-token
 * header, and nothing else. Writes go through the update-rsvp Edge Function,
 * same as submission, because headcount and the deadline cannot be client-trusted.
 *
 * Uses plain fetch via supabase-config rather than supabase-js — this runs on the
 * guest path and must not drag ~220 KB of client into the invite bundle.
 */

import { SUPABASE_ANON_KEY, SUPABASE_URL, edgeFunctionUrl, isSupabaseConfigured } from "./supabase-config";
import { normalizePhone } from "./phone";
import type { ChildEntry, RsvpFormValues } from "../types/rsvp";

/**
 * Loading either succeeds, or fails in a way the UI must present differently.
 * `not_found` is a friendly dead-end with a WhatsApp fallback; `error` is worth
 * a retry. They must never be collapsed — telling someone their link is invalid
 * when the network merely blipped would send them to the host for nothing.
 */
export type LoadEditResult =
  | { status: "found"; values: RsvpFormValues }
  | { status: "not_found" }
  | { status: "error"; message: string };

export type SaveEditResult =
  | { status: "success"; totalHeadcount: number }
  | { status: "not_found" }
  | { status: "error"; message: string };

const GENERIC_SAVE_ERROR =
  "We couldn't save your changes just now. Please try again, or message the host on WhatsApp.";

/** Shape returned by the PostgREST select below. Snake_case is the DB's, not ours. */
interface RsvpRow {
  guest_full_name: string;
  email: string;
  phone: string;
  is_attending: boolean;
  has_plus_one: boolean;
  plus_one_name: string | null;
  has_nanny: boolean;
  nanny_count: number;
  dietary_notes: string | null;
  message_to_celebrant: string | null;
  rsvp_children: Array<{ id: string; age: number; gender: ChildEntry["gender"] }> | null;
}

function toFormValues(row: RsvpRow): RsvpFormValues {
  return {
    guestFullName: row.guest_full_name,
    email: row.email,
    phone: row.phone,
    isAttending: row.is_attending,
    hasPlusOne: row.has_plus_one,
    plusOneName: row.plus_one_name ?? "",
    children: (row.rsvp_children ?? []).map((child) => ({
      id: child.id,
      age: child.age,
      gender: child.gender,
    })),
    hasNanny: row.has_nanny,
    nannyCount: row.nanny_count,
    dietaryNotes: row.dietary_notes ?? "",
    messageToCelebrant: row.message_to_celebrant ?? "",
  };
}

export async function loadRsvpByToken(token: string): Promise<LoadEditResult> {
  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message: "The RSVP service isn't configured yet. Please message the host on WhatsApp.",
    };
  }

  const columns =
    "guest_full_name,email,phone,is_attending,has_plus_one,plus_one_name," +
    "has_nanny,nanny_count,dietary_notes,message_to_celebrant," +
    "rsvp_children(id,age,gender)";

  let response: Response;

  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/rsvps?select=${encodeURIComponent(columns)}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        // RLS reads this header. There is no filter in the query itself — the
        // policy is what limits the result to a single row.
        "x-rsvp-edit-token": token,
      },
    });
  } catch (err) {
    console.error("[rsvp-edit] load request failed:", err);
    return {
      status: "error",
      message: "We couldn't reach the server. Check your connection and try again.",
    };
  }

  if (!response.ok) {
    console.error("[rsvp-edit] load returned", response.status);
    return { status: "error", message: "We couldn't load your RSVP. Please try again." };
  }

  let rows: RsvpRow[];
  try {
    rows = (await response.json()) as RsvpRow[];
  } catch {
    return { status: "error", message: "We couldn't load your RSVP. Please try again." };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { status: "not_found" };
  }

  return { status: "found", values: toFormValues(rows[0]) };
}

export async function saveRsvpByToken(
  token: string,
  values: RsvpFormValues,
): Promise<SaveEditResult> {
  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message: "The RSVP service isn't configured yet. Please message the host on WhatsApp.",
    };
  }

  let response: Response;

  try {
    response = await fetch(edgeFunctionUrl("update-rsvp"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ ...values, phone: normalizePhone(values.phone), editToken: token }),
    });
  } catch (err) {
    console.error("[rsvp-edit] save request failed:", err);
    return {
      status: "error",
      message:
        "We couldn't reach the server. Check your connection and try again, or message the host on WhatsApp.",
    };
  }

  let body: { status?: string; message?: string; record?: { totalHeadcount?: number } };
  try {
    body = await response.json();
  } catch {
    return { status: "error", message: GENERIC_SAVE_ERROR };
  }

  if (body.status === "not_found") {
    return { status: "not_found" };
  }

  if (!response.ok || body.status !== "success") {
    return { status: "error", message: body.message || GENERIC_SAVE_ERROR };
  }

  return { status: "success", totalHeadcount: body.record?.totalHeadcount ?? 0 };
}
