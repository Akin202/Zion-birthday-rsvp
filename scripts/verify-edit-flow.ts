/**
 * End-to-end checks for the RSVP edit path.
 *
 * Exercises the real HTTP surface a guest hits from their confirmation email:
 * a PostgREST read gated only by RLS and the x-rsvp-edit-token header, then a
 * write through the update-rsvp Edge Function.
 *
 * Requires the local stack plus the functions runtime:
 *   npx supabase start
 *   npx supabase functions serve --no-verify-jwt   # in another terminal
 *   npm run verify:edit
 */

import { resolveSupabaseCredentials } from './local-env';

const { url, anonKey, serviceKey } = resolveSupabaseCredentials();

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail: string) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${detail}`);
  }
}

const EDIT_COLUMNS =
  'guest_full_name,email,phone,is_attending,has_plus_one,plus_one_name,' +
  'has_nanny,nanny_count,dietary_notes,message_to_celebrant,rsvp_children(id,age,gender)';

/** Mirrors lib/rsvp-edit.ts loadRsvpByToken — no filter, RLS does the work. */
async function readByToken(token: string) {
  const res = await fetch(`${url}/rest/v1/rsvps?select=${encodeURIComponent(EDIT_COLUMNS)}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'x-rsvp-edit-token': token,
    },
  });
  return { status: res.status, rows: (await res.json()) as unknown[] };
}

async function callFunction(name: string, body: unknown) {
  const res = await fetch(`${url}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, any> };
}

const suffix = Date.now();
const email = `edit.flow.${suffix}@example.com`;

const basePayload = {
  guestFullName: 'Edit Flow Tester',
  email,
  phone: '08031234567',
  isAttending: true,
  hasPlusOne: false,
  plusOneName: '',
  children: [{ id: 'c1', age: 6, gender: 'male' }],
  hasNanny: false,
  nannyCount: 0,
  dietaryNotes: '',
  messageToCelebrant: 'Original message',
};

async function main() {
  console.log(`\nRSVP edit flow against ${url}\n`);

  const created = await callFunction('submit-rsvp', basePayload);
  if (created.status !== 200 || !created.body.record?.editToken) {
    console.error(
      'Could not create the fixture RSVP. Is `supabase functions serve` running?\n',
      created.status,
      JSON.stringify(created.body),
    );
    process.exit(1);
  }

  const token: string = created.body.record.editToken;

  // --- Read path ---------------------------------------------------------

  const mine = await readByToken(token);
  check(
    'a valid token reads back exactly one row',
    Array.isArray(mine.rows) && mine.rows.length === 1,
    `got ${JSON.stringify(mine.rows).slice(0, 200)}`,
  );

  const child = (mine.rows[0] as any)?.rsvp_children;
  check(
    'the child rows come back with the parent in one request',
    Array.isArray(child) && child.length === 1 && child[0].age === 6,
    `got ${JSON.stringify(child)}`,
  );

  const unknown = await readByToken('00000000-0000-0000-0000-000000000000');
  check(
    'an unknown token reads back nothing',
    Array.isArray(unknown.rows) && unknown.rows.length === 0,
    `got ${JSON.stringify(unknown.rows).slice(0, 200)}`,
  );

  const noHeader = await fetch(`${url}/rest/v1/rsvps?select=guest_full_name`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const noHeaderRows = (await noHeader.json()) as unknown[];
  check(
    'omitting the token header reads back nothing',
    Array.isArray(noHeaderRows) && noHeaderRows.length === 0,
    `got ${JSON.stringify(noHeaderRows).slice(0, 200)}`,
  );

  // --- Write path --------------------------------------------------------

  const updated = await callFunction('update-rsvp', {
    ...basePayload,
    editToken: token,
    hasPlusOne: true,
    plusOneName: 'Plus One',
    children: [
      { id: 'c1', age: 6, gender: 'male' },
      { id: 'c2', age: 9, gender: 'female' },
    ],
    messageToCelebrant: 'Updated message',
  });

  check(
    'a valid token updates the RSVP',
    updated.status === 200 && updated.body.status === 'success',
    `${updated.status} ${JSON.stringify(updated.body)}`,
  );

  check(
    'headcount is recomputed server-side after the edit',
    updated.body.record?.totalHeadcount === 4,
    `expected 4 (guest + plus one + 2 children), got ${updated.body.record?.totalHeadcount}`,
  );

  const afterEdit = await readByToken(token);
  const afterRow = afterEdit.rows[0] as any;
  check(
    'child rows are replaced, not appended, on edit',
    Array.isArray(afterRow?.rsvp_children) && afterRow.rsvp_children.length === 2,
    `got ${afterRow?.rsvp_children?.length} child rows`,
  );

  check(
    'edited fields are persisted',
    afterRow?.message_to_celebrant === 'Updated message' && afterRow?.has_plus_one === true,
    `got ${JSON.stringify({
      message: afterRow?.message_to_celebrant,
      plusOne: afterRow?.has_plus_one,
    })}`,
  );

  check(
    'the edit token is unchanged, so the emailed link keeps working',
    updated.body.record?.editToken === token,
    `got ${updated.body.record?.editToken}`,
  );

  // --- Token handling ----------------------------------------------------

  const unknownToken = await callFunction('update-rsvp', {
    ...basePayload,
    editToken: '00000000-0000-0000-0000-000000000000',
  });
  check(
    'an unknown token is rejected without leaking whether it exists',
    unknownToken.status === 404 && unknownToken.body.status === 'not_found',
    `${unknownToken.status} ${JSON.stringify(unknownToken.body)}`,
  );

  const malformed = await callFunction('update-rsvp', {
    ...basePayload,
    editToken: 'not-a-uuid',
  });
  check(
    'a malformed token gets the identical response to an unknown one',
    malformed.status === 404 && malformed.body.message === unknownToken.body.message,
    `${malformed.status} ${JSON.stringify(malformed.body)}`,
  );

  const missing = await callFunction('update-rsvp', { ...basePayload });
  check(
    'a missing token is rejected before any database call',
    missing.status === 404 && missing.body.status === 'not_found',
    `${missing.status} ${JSON.stringify(missing.body)}`,
  );

  const invalidPayload = await callFunction('update-rsvp', {
    ...basePayload,
    editToken: token,
    email: 'not-an-email',
  });
  check(
    'the edit path revalidates the payload, not just the token',
    invalidPayload.status === 400 && invalidPayload.body.status === 'error',
    `${invalidPayload.status} ${JSON.stringify(invalidPayload.body)}`,
  );

  // --- Cleanup -----------------------------------------------------------

  await fetch(`${url}/rest/v1/rsvps?email=eq.${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  console.log(`\n${passed}/${passed + failed} checks passed`);
  if (failed > 0) {
    console.error('The edit flow is not behaving as specified.');
    process.exit(1);
  }
  console.log('Edit links read and write exactly one RSVP, and fail closed otherwise.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
