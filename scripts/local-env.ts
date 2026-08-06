/**
 * Resolves Supabase credentials for the verification scripts.
 *
 * Explicit environment variables always win, so the same scripts can be pointed
 * at a real project in CI. When they are absent we fall back to reading the
 * running local stack via `supabase status -o env` rather than making the
 * developer copy keys by hand — that manual step was a recurring source of
 * "script exits 1, nothing verified" runs.
 */

import { execFileSync } from 'node:child_process';

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
  serviceKey: string;
}

function readLocalStackEnv(): Record<string, string> {
  try {
    const raw = execFileSync('npx', ['supabase', 'status', '-o', 'env'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    return Object.fromEntries(
      raw
        .split('\n')
        .map((line) => line.match(/^([A-Z_0-9]+)="?(.*?)"?$/))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map((m) => [m[1], m[2]]),
    );
  } catch {
    // Stack not running, or the CLI is unavailable. Handled by the caller.
    return {};
  }
}

export function resolveSupabaseCredentials(): SupabaseCredentials {
  const explicit = {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  if (explicit.url && explicit.anonKey && explicit.serviceKey) {
    return explicit as SupabaseCredentials;
  }

  const local = readLocalStackEnv();
  const url = explicit.url ?? local.API_URL;
  const anonKey = explicit.anonKey ?? local.ANON_KEY;
  const serviceKey = explicit.serviceKey ?? local.SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    console.error(
      'Could not resolve Supabase credentials.\n' +
        'Either start the local stack (`npx supabase start`) or set\n' +
        'SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.',
    );
    process.exit(1);
  }

  return { url, anonKey, serviceKey };
}
