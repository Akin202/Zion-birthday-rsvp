/**
 * Shared HTTP concerns for the RSVP Edge Functions: CORS, JSON responses, and
 * a small in-memory rate limiter.
 */

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export function corsHeaders(origin: string | null): Record<string, string> {
  // With no allow-list configured (local dev), echo the origin back. In
  // production ALLOWED_ORIGINS should name the real site so a third-party page
  // cannot drive these endpoints from a victim's browser.
  const allow =
    ALLOWED_ORIGINS.length === 0
      ? (origin ?? '*')
      : origin && ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-rsvp-edit-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function json(
  body: unknown,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

/**
 * Best-effort client IP. Edge Functions sit behind a proxy, so the left-most
 * x-forwarded-for entry is the closest thing to the caller.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') ?? 'unknown';
}

/**
 * Fixed-window rate limiter, per isolate.
 *
 * Deliberately simple: this guards against a single abusive client hammering
 * the form, which is the realistic threat for a 150-household private invite.
 * It is NOT a distributed limiter — Supabase may run several isolates, so the
 * effective ceiling is (limit x isolates). If this ever needs to be exact, move
 * the counter into Postgres.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/** Drops expired buckets so the map cannot grow without bound. */
export function sweepRateLimitBuckets(now = Date.now()): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}
