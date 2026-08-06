/**
 * RLS proof.
 *
 * The privacy guarantee sold to the client is that nobody holding the public
 * anon key can enumerate the guest list. This script tries to break that
 * guarantee several ways and fails loudly if any attempt succeeds.
 *
 * Run against local Supabase (keys are read from the running stack):
 *   npx supabase start
 *   npm run verify:rls
 *
 * Run against a real project:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npm run verify:rls
 */

import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseCredentials } from './local-env';

const { url, anonKey, serviceKey } = resolveSupabaseCredentials();

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

interface Check {
  name: string;
  detail: string;
  passed: boolean;
}

const checks: Check[] = [];

function record(name: string, passed: boolean, detail: string) {
  checks.push({ name, detail, passed });
  console.log(`${passed ? '  PASS' : '  FAIL'}  ${name}`);
  console.log(`        ${detail}`);
}

async function main() {
  console.log('\nRLS verification against', url, '\n');

  // Seed one row through service_role so there is something to try to steal.
  const seed = await admin.rpc('create_rsvp', {
    payload: {
      guestFullName: 'RLS Probe Subject',
      email: `rls-probe-${Date.now()}@example.com`,
      phone: '+2348012345678',
      isAttending: true,
      hasPlusOne: false,
      plusOneName: '',
      children: [{ id: 'c1', age: 6, gender: 'female' }],
      hasNanny: false,
      nannyCount: 0,
      dietaryNotes: '',
      messageToCelebrant: '',
    },
  });

  if (seed.error) {
    console.error('Could not seed a probe row:', seed.error.message);
    process.exit(1);
  }

  const seeded = seed.data as { id: string; editToken: string };
  console.log(`Seeded probe row ${seeded.id}\n`);

  // --- 1. The headline check -------------------------------------------------
  const fullRead = await anon.from('rsvps').select('*');
  record(
    'anon cannot read the rsvps table',
    (fullRead.data?.length ?? 0) === 0,
    fullRead.error
      ? `blocked with: ${fullRead.error.message}`
      : `returned ${fullRead.data?.length ?? 0} rows (must be 0)`,
  );

  // --- 2. Child rows are just as private ------------------------------------
  const childRead = await anon.from('rsvp_children').select('*');
  record(
    'anon cannot read the rsvp_children table',
    (childRead.data?.length ?? 0) === 0,
    childRead.error
      ? `blocked with: ${childRead.error.message}`
      : `returned ${childRead.data?.length ?? 0} rows (must be 0)`,
  );

  // --- 3. Targeted reads must not work either --------------------------------
  const byEmail = await anon.from('rsvps').select('email,phone').limit(1000);
  record(
    'anon cannot harvest contact columns',
    (byEmail.data?.length ?? 0) === 0,
    byEmail.error
      ? `blocked with: ${byEmail.error.message}`
      : `returned ${byEmail.data?.length ?? 0} rows (must be 0)`,
  );

  const byId = await anon.from('rsvps').select('*').eq('id', seeded.id);
  record(
    'anon cannot read a row by guessing its id',
    (byId.data?.length ?? 0) === 0,
    byId.error
      ? `blocked with: ${byId.error.message}`
      : `returned ${byId.data?.length ?? 0} rows (must be 0)`,
  );

  // --- 4. Mutation is closed off --------------------------------------------
  const update = await anon.from('rsvps').update({ checked_in: true }).eq('id', seeded.id);
  record(
    'anon cannot update an RSVP',
    update.error !== null || update.count === 0,
    update.error ? `blocked with: ${update.error.message}` : 'no rows affected',
  );

  const del = await anon.from('rsvps').delete().eq('id', seeded.id);
  record(
    'anon cannot delete an RSVP',
    del.error !== null || del.count === 0,
    del.error ? `blocked with: ${del.error.message}` : 'no rows affected',
  );

  // --- 5. anon must not be able to skip server-side validation ---------------
  const rpc = await anon.rpc('create_rsvp', { payload: {} });
  record(
    'anon cannot call create_rsvp directly',
    rpc.error !== null,
    rpc.error ? `blocked with: ${rpc.error.message}` : 'the RPC executed (must not)',
  );

  // --- 6. The edit-token path must actually work -----------------------------
  const tokenClient = createClient(url, anonKey!, {
    auth: { persistSession: false },
    global: { headers: { 'x-rsvp-edit-token': seeded.editToken } },
  });

  const withToken = await tokenClient.from('rsvps').select('*');
  record(
    'a valid edit_token returns exactly its own row',
    withToken.data?.length === 1 && withToken.data[0].id === seeded.id,
    withToken.error
      ? `errored: ${withToken.error.message}`
      : `returned ${withToken.data?.length ?? 0} row(s)`,
  );

  const wrongToken = createClient(url, anonKey!, {
    auth: { persistSession: false },
    global: { headers: { 'x-rsvp-edit-token': '00000000-0000-0000-0000-000000000000' } },
  });

  const withWrongToken = await wrongToken.from('rsvps').select('*');
  record(
    'a wrong edit_token returns nothing',
    (withWrongToken.data?.length ?? 0) === 0,
    withWrongToken.error
      ? `blocked with: ${withWrongToken.error.message}`
      : `returned ${withWrongToken.data?.length ?? 0} rows (must be 0)`,
  );

  const malformedToken = createClient(url, anonKey!, {
    auth: { persistSession: false },
    global: { headers: { 'x-rsvp-edit-token': 'not-a-uuid' } },
  });

  const withMalformed = await malformedToken.from('rsvps').select('*');
  record(
    'a malformed edit_token denies rather than errors the request',
    (withMalformed.data?.length ?? 0) === 0,
    withMalformed.error
      ? `blocked with: ${withMalformed.error.message}`
      : `returned ${withMalformed.data?.length ?? 0} rows (must be 0)`,
  );

  // --- Cleanup ---------------------------------------------------------------
  await admin.from('rsvps').delete().eq('id', seeded.id);

  // --- Report ----------------------------------------------------------------
  const failed = checks.filter((c) => !c.passed);

  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);

  if (failed.length > 0) {
    console.error('\nRLS VERIFICATION FAILED:');
    for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
    console.error('\nGuest data is exposed. Do not deploy.');
    process.exit(1);
  }

  console.log('Guest list is not enumerable with the anon key.\n');
}

main().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
