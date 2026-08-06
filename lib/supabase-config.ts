/**
 * Supabase connection details, with no dependency on @supabase/supabase-js.
 *
 * This is split out from lib/supabase.ts deliberately. The guest RSVP path only
 * needs a URL and the anon key to POST to an Edge Function — importing the full
 * client for that pulls auth, realtime, storage and postgrest into the bundle
 * every guest downloads, which cost ~220 KB (~58 KB gzipped) when it was in one
 * module. Guests are on mid-range Androids over patchy mobile data; the admin
 * area can afford the client, the invite cannot.
 *
 * The anon key is public by design — guest privacy rests on RLS, not on hiding
 * it. See supabase/migrations/*_rls_policies.sql.
 */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Absolute URL of a Supabase Edge Function. */
export function edgeFunctionUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}
