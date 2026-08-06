-- Row Level Security for the RSVP tables.
--
-- CONTRACTUAL. The end client refused to share her guest list because she was
-- worried about contact data being misused. The guarantee sold to her is that
-- no one — including anyone who reads the anon key straight out of the public
-- JS bundle — can enumerate the guest list.
--
-- The model:
--   anon           INSERT only, plus SELECT of a single row it already holds
--                  the edit_token for. No unfiltered SELECT, ever.
--   authenticated  Full read + update. This is the admin area, behind Supabase
--                  Auth. There is no public sign-up, so authenticated == admin.
--   service_role   Full access. Used only by Edge Functions, never in browser JS.
--
-- Writes do NOT go through these policies in normal operation: the client calls
-- the submit-rsvp / update-rsvp Edge Functions, which use service_role and
-- revalidate everything. The anon INSERT policy is defence in depth, not the
-- happy path.

alter table public.rsvps         enable row level security;
alter table public.rsvp_children enable row level security;

-- Force RLS even for the table owner, so a mistake in a SECURITY DEFINER
-- function cannot quietly bypass these policies.
alter table public.rsvps         force row level security;
alter table public.rsvp_children force row level security;

-- ---------------------------------------------------------------------------
-- The edit-token capability
-- ---------------------------------------------------------------------------
--
-- A guest proves ownership of a row by sending its edit_token in the
-- `x-rsvp-edit-token` request header. The policy reads that header out of the
-- GUC PostgREST already populates — deliberately NOT from a query predicate,
-- so widening the filter client-side cannot widen what comes back.
--
-- Everything here degrades to "deny" rather than "error":
--   - header absent           -> current_setting(..., true) yields NULL
--   - headers GUC absent      -> NULL
--   - token is not a UUID     -> compared as text, so no cast exception
-- and `edit_token::text = NULL` is NULL, which RLS treats as no match.

create or replace function public.current_edit_token()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.headers', true)::json ->> 'x-rsvp-edit-token',
      ''
    ),
    ''
  );
$$;

comment on function public.current_edit_token is
  'Reads the guest edit token from the PostgREST request headers GUC. Returns '
  'NULL when absent or empty, so a missing token denies rather than raises.';

-- ---------------------------------------------------------------------------
-- rsvps policies
-- ---------------------------------------------------------------------------

drop policy if exists rsvps_anon_insert          on public.rsvps;
drop policy if exists rsvps_anon_select_by_token on public.rsvps;
drop policy if exists rsvps_admin_select         on public.rsvps;
drop policy if exists rsvps_admin_update         on public.rsvps;

-- anon may submit an RSVP.
create policy rsvps_anon_insert
  on public.rsvps
  for insert
  to anon
  with check (true);

-- anon may read exactly the one row whose edit_token it presented.
create policy rsvps_anon_select_by_token
  on public.rsvps
  for select
  to anon
  using (edit_token::text = public.current_edit_token());

-- Deliberately absent for anon: UPDATE and DELETE. Guest edits go through the
-- update-rsvp Edge Function, which verifies the token server-side.

-- Admins (Supabase Auth session) get the full list.
create policy rsvps_admin_select
  on public.rsvps
  for select
  to authenticated
  using (true);

create policy rsvps_admin_update
  on public.rsvps
  for update
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- rsvp_children policies
-- ---------------------------------------------------------------------------

drop policy if exists rsvp_children_anon_insert          on public.rsvp_children;
drop policy if exists rsvp_children_anon_select_by_token on public.rsvp_children;
drop policy if exists rsvp_children_admin_select         on public.rsvp_children;
drop policy if exists rsvp_children_admin_update         on public.rsvp_children;

create policy rsvp_children_anon_insert
  on public.rsvp_children
  for insert
  to anon
  with check (true);

-- Child rows inherit their parent's visibility.
create policy rsvp_children_anon_select_by_token
  on public.rsvp_children
  for select
  to anon
  using (
    exists (
      select 1
      from public.rsvps r
      where r.id = rsvp_children.rsvp_id
        and r.edit_token::text = public.current_edit_token()
    )
  );

create policy rsvp_children_admin_select
  on public.rsvp_children
  for select
  to authenticated
  using (true);

create policy rsvp_children_admin_update
  on public.rsvp_children
  for update
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
--
-- RLS filters rows, but only after the role has table-level privilege. Revoke
-- everything first so nothing is inherited from PUBLIC, then grant narrowly.

revoke all on public.rsvps         from anon, authenticated, service_role;
revoke all on public.rsvp_children from anon, authenticated, service_role;

grant insert, select on public.rsvps         to anon;
grant insert, select on public.rsvp_children to anon;

grant select, update on public.rsvps         to authenticated;
grant select, update on public.rsvp_children to authenticated;

-- service_role must be granted explicitly rather than left to Supabase's
-- ambient default privileges. Without this it ends up with only
-- REFERENCES/TRIGGER/TRUNCATE, and every Edge Function read returns an empty
-- result instead of an error — a silent failure that is very easy to miss,
-- because SECURITY DEFINER functions keep working throughout.
grant select, insert, update, delete on public.rsvps         to service_role;
grant select, insert, update, delete on public.rsvp_children to service_role;

grant execute on function public.current_edit_token() to anon, authenticated, service_role;
