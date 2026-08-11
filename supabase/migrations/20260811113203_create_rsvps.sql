-- ============================================================
-- Create the rsvps table for Zion's Birthday RSVP app
-- ============================================================

create table if not exists public.rsvps (
  id               uuid primary key default gen_random_uuid(),
  guest_full_name  text not null,
  email            text not null,
  phone            text not null,
  is_attending     boolean not null default true,
  has_plus_one     boolean not null default false,
  plus_one_name    text not null default '',
  children         jsonb not null default '[]'::jsonb,
  has_nanny        boolean not null default false,
  nanny_count      integer not null default 0,
  dietary_notes    text not null default '',
  message_to_celebrant text not null default '',
  total_headcount  integer not null default 1,
  checked_in       boolean not null default false,
  checked_in_at    timestamptz,
  actual_headcount integer,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Prevent duplicate RSVPs from the same email
create unique index if not exists rsvps_email_unique on public.rsvps (email);

-- Index for name-based searching in admin panel
create index if not exists rsvps_guest_name_idx on public.rsvps (guest_full_name);

-- ============================================================
-- Auto-update the updated_at timestamp on every row change
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_rsvps_update
  before update on public.rsvps
  for each row
  execute function public.handle_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.rsvps enable row level security;

-- Anyone can submit an RSVP (public insert)
create policy "Allow public insert"
  on public.rsvps
  for insert
  to anon, authenticated
  with check (true);

-- Anyone can read RSVPs (admin panel is gated by hardcoded login on the frontend)
create policy "Allow public select"
  on public.rsvps
  for select
  to anon, authenticated
  using (true);

-- Anyone can update RSVPs (admin operations — gated by frontend auth)
create policy "Allow public update"
  on public.rsvps
  for update
  to anon, authenticated
  using (true)
  with check (true);
