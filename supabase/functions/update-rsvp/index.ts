/**
 * update-rsvp — the edit path for a guest who already RSVP'd.
 *
 * The edit token is a bearer capability: whoever holds it can change that one
 * RSVP. That is the intended design (the link lives in the guest's email), but
 * it means this function must be careful about two things:
 *
 *   1. Never confirm or deny that an unknown token exists. update_rsvp_by_token
 *      returns {found:false} for both "no such token" and "malformed token",
 *      and this function turns both into the same guest-facing message.
 *   2. A stricter rate limit than submit-rsvp, because a valid token is
 *      guessable only by brute force and there is no other gate.
 *
 * Everything else mirrors submit-rsvp: same validator, same deadline rule,
 * headcount recomputed in SQL, no npm imports.
 */

import { validateSubmission } from '../_shared/validation.ts';
import { clientIp, corsHeaders, json, rateLimit, sweepRateLimitBuckets } from '../_shared/http.ts';
import { sendConfirmationEmail } from '../_shared/email.ts';

declare const EdgeRuntime: { waitUntil?: (p: Promise<unknown>) => void } | undefined;

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Deliberately identical for "not found" and "malformed" — see the header. */
const NOT_FOUND_MESSAGE =
  'That link is no longer valid. Please message the host to update your RSVP.';

function isPastDeadline(): boolean {
  const deadline = Deno.env.get('RSVP_DEADLINE');
  if (!deadline) return false;

  const parsed = Date.parse(deadline);
  if (Number.isNaN(parsed)) {
    console.error('RSVP_DEADLINE is not a parseable date:', deadline);
    return false; // Fail open, same as submit-rsvp.
  }

  return Date.now() > parsed;
}

interface UpdateRsvpResult {
  found: boolean;
  id?: string;
  editToken?: string;
  totalHeadcount?: number;
  createdAt?: string;
  updatedAt?: string;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return json({ status: 'error', message: 'Method not allowed' }, 405, origin);
  }

  sweepRateLimitBuckets();

  const limit = rateLimit(`update:${clientIp(req)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return json(
      {
        status: 'error',
        message: "You've sent a few requests very quickly. Please wait a moment and try again.",
        retryAfter: limit.retryAfterSeconds,
      },
      429,
      origin,
    );
  }

  if (isPastDeadline()) {
    return json(
      { status: 'error', message: 'RSVPs have closed. Please contact the host directly.' },
      403,
      origin,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ status: 'error', message: 'Invalid request body.' }, 400, origin);
  }

  const token = (body as { editToken?: unknown } | null)?.editToken;

  if (typeof token !== 'string' || !UUID_PATTERN.test(token)) {
    // Shape-check before touching the database so a malformed token cannot be
    // distinguished from a valid-but-unknown one by response timing or wording.
    return json({ status: 'not_found', message: NOT_FOUND_MESSAGE }, 404, origin);
  }

  const validated = validateSubmission(body);
  if (!validated.ok) {
    return json(
      {
        status: 'error',
        message: 'Some of those details need another look.',
        issues: validated.issues,
      },
      400,
      origin,
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return json(
      { status: 'error', message: 'The server is misconfigured. Please contact the host.' },
      500,
      origin,
    );
  }

  let rpcResponse: Response;
  try {
    rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/update_rsvp_by_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ p_token: token, payload: validated.value }),
    });
  } catch (err) {
    console.error('update_rsvp_by_token request failed:', err);
    return json(
      {
        status: 'error',
        message: "We couldn't save your changes just now. Please try again, or message the host.",
      },
      500,
      origin,
    );
  }

  if (!rpcResponse.ok) {
    console.error('update_rsvp_by_token returned', rpcResponse.status, await rpcResponse.text());
    return json(
      {
        status: 'error',
        message: "We couldn't save your changes just now. Please try again, or message the host.",
      },
      500,
      origin,
    );
  }

  const result = (await rpcResponse.json()) as UpdateRsvpResult;

  if (!result.found) {
    return json({ status: 'not_found', message: NOT_FOUND_MESSAGE }, 404, origin);
  }

  // Same reasoning as submit-rsvp: the update is committed, so email failure
  // must not become a guest-visible error.
  const emailTask = sendConfirmationEmail({
    guestFullName: validated.value.guestFullName,
    email: validated.value.email,
    isAttending: validated.value.isAttending,
    editToken: token,
    totalHeadcount: result.totalHeadcount ?? 0,
    childCount: validated.value.children.length,
    hasPlusOne: validated.value.hasPlusOne,
    nannyCount: validated.value.hasNanny ? validated.value.nannyCount : 0,
  });

  if (typeof EdgeRuntime !== 'undefined' && typeof EdgeRuntime.waitUntil === 'function') {
    EdgeRuntime.waitUntil(emailTask);
  } else {
    void emailTask;
  }

  return json(
    {
      status: 'success',
      record: {
        id: result.id,
        editToken: token,
        totalHeadcount: result.totalHeadcount,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    },
    200,
    origin,
  );
});
