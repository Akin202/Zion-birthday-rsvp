import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./supabase-config";

/**
 * Browser Supabase client — admin area only.
 *
 * Importing this module pulls in the full supabase-js bundle (auth, realtime,
 * storage, postgrest). Do NOT import it from anything on the guest path; use
 * lib/supabase-config.ts there instead. See that file for why.
 *
 * This uses the ANON key, which ships in the public JS bundle by design. Guest
 * privacy does not depend on hiding it — it depends on RLS:
 *   - anon may INSERT
 *   - anon may SELECT exactly one row, and only by presenting its edit_token
 *   - admin reads require a real Supabase Auth session
 *
 * The service_role key must never appear in this file or anywhere under a
 * VITE_ prefix. It lives only in Edge Function secrets.
 */

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. " +
      "Copy .env.example to .env.local and fill them in.",
  );
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || "http://localhost:54321",
  SUPABASE_ANON_KEY || "missing-anon-key",
  {
    auth: {
      persistSession: true,
      // Door staff must not be logged out mid-event.
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

/**
 * Reads a single RSVP using its edit token. The token goes in a header, not a
 * query predicate — the RLS policy reads it from the request headers, so the
 * client cannot widen the query to return anyone else's row.
 */
export function supabaseWithEditToken(token: string): SupabaseClient {
  return createClient(
    SUPABASE_URL || "http://localhost:54321",
    SUPABASE_ANON_KEY || "missing-anon-key",
    {
      auth: { persistSession: false },
      global: { headers: { "x-rsvp-edit-token": token } },
    },
  );
}

export { isSupabaseConfigured };
