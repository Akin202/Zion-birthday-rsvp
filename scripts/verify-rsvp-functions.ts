/**
 * Behavioural checks for create_rsvp / update_rsvp_by_token.
 *
 * These run against a real Postgres because the guarantees being checked —
 * atomicity, server-computed headcount, duplicate collapsing — live in SQL and
 * cannot be exercised by the unit tests.
 *
 *   npx supabase start && npx supabase db reset
 *   npm run verify:db
 */

import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseCredentials } from './local-env';

const { url, serviceKey } = resolveSupabaseCredentials();

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

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

const email = () => `fn-probe-${crypto.randomUUID()}@example.com`;

function payload(overrides: Record<string, unknown> = {}) {
  return {
    guestFullName: 'Function Probe',
    email: email(),
    phone: '+2348012345678',
    isAttending: true,
    hasPlusOne: false,
    plusOneName: '',
    children: [],
    hasNanny: false,
    nannyCount: 0,
    dietaryNotes: '',
    messageToCelebrant: '',
    ...overrides,
  };
}

async function main() {
  console.log('\nRSVP function behaviour against', url, '\n');
  const createdIds: string[] = [];

  // --- headcount is computed server-side -------------------------------------
  {
    const { data, error } = await db.rpc('create_rsvp', {
      payload: payload({
        hasPlusOne: true,
        plusOneName: 'Plus One',
        children: [
          { id: 'c1', age: 6, gender: 'female' },
          { id: 'c2', age: 8, gender: 'male' },
          { id: 'c3', age: 3, gender: 'male' },
        ],
        hasNanny: true,
        nannyCount: 1,
      }),
    });

    const r = data as { id: string; totalHeadcount: number };
    if (r?.id) createdIds.push(r.id);

    // 1 guest + 1 plus-one + 3 children + 1 nanny
    check(
      'headcount is computed from the payload, not supplied by the caller',
      !error && r?.totalHeadcount === 6,
      error ? error.message : `got ${r?.totalHeadcount}, expected 6`,
    );
  }

  // --- a client-supplied headcount is ignored --------------------------------
  {
    const { data } = await db.rpc('create_rsvp', {
      payload: payload({ totalHeadcount: 999, total_headcount: 999 }),
    });

    const r = data as { id: string; totalHeadcount: number };
    if (r?.id) createdIds.push(r.id);

    check(
      'a forged headcount in the payload is ignored',
      r?.totalHeadcount === 1,
      `got ${r?.totalHeadcount}, expected 1`,
    );
  }

  // --- declining collapses to zero -------------------------------------------
  {
    const { data } = await db.rpc('create_rsvp', {
      payload: payload({
        isAttending: false,
        hasPlusOne: true,
        plusOneName: 'Ghost',
        children: [{ id: 'c1', age: 6, gender: 'female' }],
        hasNanny: true,
        nannyCount: 2,
      }),
    });

    const r = data as { id: string; totalHeadcount: number };
    if (r?.id) createdIds.push(r.id);

    const kids = await db.from('rsvp_children').select('id').eq('rsvp_id', r.id);

    // Assert on `data` being an array, not on length: a failed query returns
    // null, which would otherwise read as "0 rows" and pass spuriously.
    check(
      'a declining guest yields headcount 0 and no child rows',
      r?.totalHeadcount === 0 && Array.isArray(kids.data) && kids.data.length === 0,
      kids.error
        ? `child query failed: ${kids.error.message}`
        : `headcount ${r?.totalHeadcount}, ${kids.data?.length} child rows`,
    );
  }

  // --- children are written atomically with the parent -----------------------
  {
    const { data } = await db.rpc('create_rsvp', {
      payload: payload({
        children: [
          { id: 'c1', age: 4, gender: 'female' },
          { id: 'c2', age: 9, gender: 'male' },
        ],
      }),
    });

    const r = data as { id: string };
    createdIds.push(r.id);

    const kids = await db
      .from('rsvp_children')
      .select('age,gender')
      .eq('rsvp_id', r.id)
      .order('age');

    check(
      'child rows land with the parent in one transaction',
      kids.data?.length === 2 && kids.data[0].age === 4 && kids.data[1].age === 9,
      kids.error ? `child query failed: ${kids.error.message}` : `got ${JSON.stringify(kids.data)}`,
    );
  }

  // --- an invalid child rolls the whole thing back ---------------------------
  {
    const probeEmail = email();
    const { error } = await db.rpc('create_rsvp', {
      payload: payload({
        email: probeEmail,
        children: [{ id: 'c1', age: 99, gender: 'male' }], // violates the 0-17 check
      }),
    });

    const { data: orphan } = await db.from('rsvps').select('id').eq('email', probeEmail);

    check(
      'an invalid child aborts the insert, leaving no partial row',
      error !== null && (orphan?.length ?? 0) === 0,
      error
        ? `rejected, ${orphan?.length ?? 0} orphan rows`
        : 'the insert succeeded but should not have',
    );
  }

  // --- duplicate email updates in place --------------------------------------
  {
    const dupEmail = email();

    const first = await db.rpc('create_rsvp', {
      payload: payload({ email: dupEmail, children: [{ id: 'c1', age: 5, gender: 'male' }] }),
    });
    const firstResult = first.data as { id: string; isDuplicate: boolean; editToken: string };
    createdIds.push(firstResult.id);

    const second = await db.rpc('create_rsvp', {
      payload: payload({
        email: dupEmail,
        guestFullName: 'Function Probe Updated',
        children: [
          { id: 'c1', age: 5, gender: 'male' },
          { id: 'c2', age: 7, gender: 'female' },
        ],
      }),
    });
    const secondResult = second.data as {
      id: string;
      isDuplicate: boolean;
      totalHeadcount: number;
      editToken: string;
    };

    check(
      'a second RSVP from the same email is flagged duplicate',
      firstResult.isDuplicate === false && secondResult.isDuplicate === true,
      `first=${firstResult.isDuplicate}, second=${secondResult.isDuplicate}`,
    );

    check(
      'a duplicate updates the existing row rather than creating a second',
      secondResult.id === firstResult.id,
      `${firstResult.id} vs ${secondResult.id}`,
    );

    check(
      'the edit token survives a duplicate update',
      secondResult.editToken === firstResult.editToken,
      'token changed, which would invalidate the link already emailed out',
    );

    const kids = await db.from('rsvp_children').select('age').eq('rsvp_id', firstResult.id);

    check(
      'child rows are replaced, not appended, on a duplicate',
      kids.data?.length === 2 && secondResult.totalHeadcount === 3,
      kids.error
        ? `child query failed: ${kids.error.message}`
        : `${kids.data?.length} child rows, headcount ${secondResult.totalHeadcount}`,
    );
  }

  // --- the edit-token update path --------------------------------------------
  {
    const { data } = await db.rpc('create_rsvp', {
      payload: payload({ children: [{ id: 'c1', age: 6, gender: 'male' }] }),
    });
    const created = data as { id: string; editToken: string };
    createdIds.push(created.id);

    const { data: updated } = await db.rpc('update_rsvp_by_token', {
      p_token: created.editToken,
      payload: payload({
        guestFullName: 'Function Probe Edited',
        children: [
          { id: 'c1', age: 6, gender: 'male' },
          { id: 'c2', age: 2, gender: 'female' },
          { id: 'c3', age: 11, gender: 'male' },
        ],
      }),
    });

    const u = updated as { found: boolean; totalHeadcount: number };

    check(
      'a valid edit token updates the row and recomputes the headcount',
      u?.found === true && u.totalHeadcount === 4,
      `found=${u?.found}, headcount=${u?.totalHeadcount}, expected 4`,
    );

    const { data: unknown } = await db.rpc('update_rsvp_by_token', {
      p_token: '00000000-0000-0000-0000-000000000000',
      payload: payload(),
    });

    check(
      'an unknown edit token reports not-found without leaking existence',
      (unknown as { found: boolean })?.found === false,
      `got ${JSON.stringify(unknown)}`,
    );
  }

  // --- cleanup ---------------------------------------------------------------
  for (const id of createdIds) {
    await db.from('rsvps').delete().eq('id', id);
  }
  await db.from('rsvps').delete().like('email', 'fn-probe-%');

  console.log(`\n${passed}/${passed + failed} checks passed`);

  if (failed > 0) {
    console.error('\nRSVP function behaviour is wrong. Do not deploy.\n');
    process.exit(1);
  }

  console.log('Headcount, atomicity and duplicate handling all behave.\n');
}

main().catch((err) => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
