/**
 * submit-rsvp — the only write path for a guest RSVP.
 *
 * Everything the client cannot be trusted with happens here:
 *   - re-validation of every field
 *   - phone normalisation to +234
 *   - RSVP deadline enforced server-side
 *   - rate limiting
 * and headcount is computed in Postgres by create_rsvp, never taken from the
 * request. The browser cannot call create_rsvp directly — it is granted to
 * service_role only.
 *
 * No npm imports: this is a single RPC call on a path the guest waits on, so
 * cold start matters more than convenience. See _shared/validation.ts.
 */

import { validateSubmission } from '../_shared/validation.ts';
import { clientIp, corsHeaders, json, rateLimit, sweepRateLimitBuckets } from '../_shared/http.ts';

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

/**
 * The deadline lives in config/event.config.ts for the UI. It is duplicated
 * into an env var rather than imported, so the server does not depend on the
 * client bundle. Keep RSVP_DEADLINE in step with event.rsvpDeadline.
 */
function isPastDeadline(): boolean {
  const deadline = Deno.env.get('RSVP_DEADLINE');
  if (!deadline) return false;

  const parsed = Date.parse(deadline);
  if (Number.isNaN(parsed)) {
    console.error('RSVP_DEADLINE is not a parseable date:', deadline);
    return false; // Fail open: a misconfigured deadline must not block real RSVPs.
  }

  return Date.now() > parsed;
}

interface CreateRsvpResult {
  id: string;
  editToken: string;
  totalHeadcount: number;
  isDuplicate: boolean;
  createdAt: string;
  updatedAt: string;
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

  const limit = rateLimit(`submit:${clientIp(req)}`, RATE_LIMIT, RATE_WINDOW_MS);
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
    rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/create_rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ payload: validated.value }),
    });
  } catch (err) {
    console.error('create_rsvp request failed:', err);
    return json(
      {
        status: 'error',
        message: "We couldn't save your RSVP just now. Please try again, or message the host.",
      },
      500,
      origin,
    );
  }

  if (!rpcResponse.ok) {
    // Log the detail server-side; never leak database internals to the guest.
    console.error('create_rsvp returned', rpcResponse.status, await rpcResponse.text());
    return json(
      {
        status: 'error',
        message: "We couldn't save your RSVP just now. Please try again, or message the host.",
      },
      500,
      origin,
    );
  }

  const result = (await rpcResponse.json()) as CreateRsvpResult;

  // TODO(claude-code): dispatch the Resend confirmation email here in Phase 2.
  // It must not block this response — if email fails the RSVP is still saved
  // and the guest still sees success.

  return json(
    {
      status: result.isDuplicate ? 'duplicate' : 'success',
      record: {
        id: result.id,
        editToken: result.editToken,
        totalHeadcount: result.totalHeadcount,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    },
    200,
    origin,
  );
});
