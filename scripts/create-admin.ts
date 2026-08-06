/**
 * Creates (or updates) the admin account for the dashboard.
 *
 * There is no self-service sign-up: the admin area is for the host and her door
 * staff, and nobody else should be able to create an account against a project
 * holding a private guest list. So accounts are provisioned here, deliberately.
 *
 * Local:
 *   npx supabase start
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npm run admin:create
 *
 * Production:
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   ADMIN_EMAIL=... ADMIN_PASSWORD='...' npm run admin:create
 *
 * The password is read from the environment and never written to disk or logged.
 */

import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseCredentials } from './local-env';

const { url, serviceKey } = resolveSupabaseCredentials();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error(
    'Set ADMIN_EMAIL and ADMIN_PASSWORD.\n\n' +
      "  ADMIN_EMAIL=host@example.com ADMIN_PASSWORD='a-long-passphrase' npm run admin:create\n",
  );
  process.exit(1);
}

if (password.length < 12) {
  // This account can read every guest's name, email and phone number. A short
  // password here is the whole privacy promise undone.
  console.error('ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data: existing } = await admin.auth.admin.listUsers();
  const match = existing?.users.find((u) => u.email?.toLowerCase() === email!.toLowerCase());

  if (match) {
    const { error } = await admin.auth.admin.updateUserById(match.id, { password });
    if (error) {
      console.error(`Could not update the password: ${error.message}`);
      process.exit(1);
    }
    console.log(`Password updated for existing admin ${email}.`);
    return;
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    // Provisioned by hand, so there is nobody to click a confirmation link.
    email_confirm: true,
  });

  if (error) {
    console.error(`Could not create the admin account: ${error.message}`);
    process.exit(1);
  }

  console.log(`Admin account created for ${email}.`);
  console.log('Sign in at /admin/login.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
