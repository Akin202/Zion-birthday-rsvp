/**
 * Client side of the RSVP write path.
 *
 * The form never writes to Postgres directly — it posts to the submit-rsvp Edge
 * Function, which re-validates everything, normalises the phone, computes the
 * headcount server-side, and enforces the deadline. This module's only job is
 * to make that call and map the outcome onto the existing SubmissionState union.
 */

// Imports from supabase-config, NOT supabase — the guest path must not pull in
// the full supabase-js client. See lib/supabase-config.ts.
import { SUPABASE_ANON_KEY, edgeFunctionUrl, isSupabaseConfigured } from "./supabase-config";
import {
  calculateHeadcount,
  type RsvpFormValues,
  type RsvpRecord,
  type SubmissionState,
} from "../types/rsvp";

/** The edit token is a capability; it is kept out of RsvpRecord deliberately. */
export interface SubmitOutcome {
  state: SubmissionState;
  editToken?: string;
}

interface SubmitResponse {
  status: "success" | "duplicate" | "error";
  message?: string;
  record?: {
    id: string;
    editToken: string;
    totalHeadcount: number;
    createdAt: string;
    updatedAt: string;
  };
}

const GENERIC_ERROR =
  "We couldn't save your RSVP just now. Please try again, or message the host on WhatsApp.";

export async function submitRsvp(values: RsvpFormValues): Promise<SubmitOutcome> {
  if (!isSupabaseConfigured) {
    return {
      state: {
        status: "error",
        message: "The RSVP service isn't configured yet. Please message the host on WhatsApp.",
      },
    };
  }

  let response: Response;

  try {
    response = await fetch(edgeFunctionUrl("submit-rsvp"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(values),
    });
  } catch (err) {
    // Network failure — the guest is likely on patchy mobile data. Never a dead
    // end: the error panel offers a WhatsApp fallback.
    console.error("[rsvp] submission request failed:", err);
    return {
      state: {
        status: "error",
        message:
          "We couldn't reach the server. Check your connection and try again, or message the host on WhatsApp.",
      },
    };
  }

  let body: SubmitResponse;
  try {
    body = (await response.json()) as SubmitResponse;
  } catch {
    console.error("[rsvp] submission returned a non-JSON response:", response.status);
    return { state: { status: "error", message: GENERIC_ERROR } };
  }

  if (body.status === "duplicate") {
    return { state: { status: "duplicate" }, editToken: body.record?.editToken };
  }

  if (!response.ok || body.status === "error" || !body.record) {
    return {
      state: { status: "error", message: body.message || GENERIC_ERROR },
    };
  }

  // Rebuild the full record for the success panel. The server is authoritative
  // on headcount and timestamps; everything else the guest just typed.
  const record: RsvpRecord = {
    ...values,
    id: body.record.id,
    createdAt: body.record.createdAt,
    updatedAt: body.record.updatedAt,
    totalHeadcount: body.record.totalHeadcount ?? calculateHeadcount(values),
    checkedIn: false,
    checkedInAt: null,
    actualHeadcount: null,
  };

  return { state: { status: "success", record }, editToken: body.record.editToken };
}
