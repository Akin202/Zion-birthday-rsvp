-- RSVP schema for Zion's 7th Birthday.
--
-- This mirrors types/rsvp.ts exactly. The TypeScript types are the contract;
-- this schema conforms to them, not the other way round. If you change one,
-- change both in the same commit.

-- ---------------------------------------------------------------------------
-- rsvps
-- ---------------------------------------------------------------------------

create table if not exists public.rsvps (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- Capability token: the only thing that lets an anonymous guest read or
  -- amend their own row. Never exposed in any list response.
  edit_token           uuid not null default gen_random_uuid(),

  guest_full_name      text not null check (length(trim(guest_full_name)) >= 3),

  -- Generated, not trigger-maintained, so it can never drift from the source
  -- column. Backs the door tool's name search.
  guest_name_lower     text generated always as (lower(trim(guest_full_name))) stored,

  -- Format is enforced here, not only in the Edge Function, so it holds no
  -- matter which path writes the row.
  email                text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  -- Normalised to +234 format by the submit-rsvp function before insert.
  phone                text not null check (phone ~ '^\+234[789][0-9]{9}$'),

  is_attending         boolean not null,
  has_plus_one         boolean not null default false,
  plus_one_name        text,
  children_count       integer not null default 0 check (children_count >= 0 and children_count <= 10),
  has_nanny            boolean not null default false,
  nanny_count          integer not null default 0 check (nanny_count >= 0 and nanny_count <= 5),

  dietary_notes        text,
  message_to_celebrant text check (message_to_celebrant is null or length(message_to_celebrant) <= 300),

  total_headcount      integer not null default 0 check (total_headcount >= 0),

  checked_in           boolean not null default false,
  checked_in_at        timestamptz,
  actual_headcount     integer check (actual_headcount is null or actual_headcount >= 0),

  -- One RSVP per email. Duplicate submissions update the existing row rather
  -- than creating a second one, which is what the "duplicate" UI state expects.
  constraint rsvps_email_unique unique (email),

  -- checked_in_at must be present exactly when checked_in is true, so the door
  -- tool can never show a check-in badge with no timestamp.
  constraint rsvps_checked_in_at_consistent check (
    (checked_in = true and checked_in_at is not null)
    or (checked_in = false and checked_in_at is null)
  ),

  -- A declined RSVP brings nobody.
  constraint rsvps_declined_has_no_headcount check (
    is_attending = true or total_headcount = 0
  ),

  -- A plus-one needs a name; no name means no plus-one.
  constraint rsvps_plus_one_named check (
    has_plus_one = false
    or (plus_one_name is not null and length(trim(plus_one_name)) >= 2)
  ),

  -- Nanny count and the nanny flag must agree in both directions.
  constraint rsvps_nanny_count_consistent check (
    (has_nanny = true and nanny_count >= 1)
    or (has_nanny = false and nanny_count = 0)
  )
);

comment on table public.rsvps is
  'One row per invited household. Guest contact data is contractually private: '
  'anon may INSERT and may SELECT only its own row via edit_token.';
comment on column public.rsvps.edit_token is
  'Capability token for the guest edit flow. Never return this in a list query.';
comment on column public.rsvps.total_headcount is
  'Computed server-side by create_rsvp/update_rsvp_by_token. Never trust a client value.';

-- ---------------------------------------------------------------------------
-- rsvp_children
-- ---------------------------------------------------------------------------

create table if not exists public.rsvp_children (
  id         uuid primary key default gen_random_uuid(),
  rsvp_id    uuid not null references public.rsvps(id) on delete cascade,
  age        integer not null check (age >= 0 and age <= 17),
  gender     text not null check (gender in ('male', 'female')),
  created_at timestamptz not null default now()
);

comment on table public.rsvp_children is
  'One row per declared child. Drives the age/gender breakdown that the client '
  'uses for party-bag and age-group planning.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists rsvps_guest_name_lower_idx on public.rsvps (guest_name_lower);
create index if not exists rsvps_edit_token_idx       on public.rsvps (edit_token);
create index if not exists rsvps_created_at_idx       on public.rsvps (created_at desc);
create index if not exists rsvp_children_rsvp_id_idx  on public.rsvp_children (rsvp_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists rsvps_set_updated_at on public.rsvps;
create trigger rsvps_set_updated_at
  before update on public.rsvps
  for each row
  execute function public.set_updated_at();
