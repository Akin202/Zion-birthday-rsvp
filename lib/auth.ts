/**
 * Admin authentication.
 *
 * Admin reads are gated by RLS on the `authenticated` role, so a session here is
 * not decoration — without one, every admin query returns nothing. The route
 * guard exists for UX (send people to the login form instead of an empty table),
 * not as the security boundary. The database is the boundary.
 *
 * Session handling is tuned for event day: door staff must not be logged out
 * while a queue is forming in front of them. See lib/supabase.ts for the client
 * options that back this up.
 */

import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type SignInResult = { ok: true } | { ok: false; message: string };

/**
 * Supabase returns a deliberately vague error for bad credentials so an attacker
 * cannot enumerate accounts. We keep that vagueness but make it readable — the
 * raw string ("Invalid login credentials") reads like a bug to a non-technical
 * host.
 */
function friendlyAuthError(message: string): string {
  const normalised = message.toLowerCase();

  if (normalised.includes("invalid login credentials")) {
    return "That email and password don't match. Please check both and try again.";
  }
  if (normalised.includes("email not confirmed")) {
    return "This account hasn't been confirmed yet. Check your inbox for the confirmation link.";
  }
  if (normalised.includes("rate limit") || normalised.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  return message;
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { ok: false, message: friendlyAuthError(error.message) };
    }

    return { ok: true };
  } catch (err: unknown) {
    console.error("[auth] sign-in threw:", err);
    return {
      ok: false,
      message: "We couldn't reach the sign-in service. Check your connection and try again.",
    };
  }
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err: unknown) {
    // Sign-out failing server-side is not worth blocking the operator over; the
    // local session is cleared either way and the route guard will bounce them.
    console.error("[auth] sign-out threw:", err);
  }
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Fires on sign-in, sign-out, and token refresh. Returns an unsubscribe fn. */
export function onAuthChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}
