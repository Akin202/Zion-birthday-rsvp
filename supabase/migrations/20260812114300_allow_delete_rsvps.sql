-- ============================================================
-- Allow deleting RSVPs (admin operations — gated by frontend auth)
-- ============================================================

create policy "Allow public delete"
  on public.rsvps
  for delete
  to anon, authenticated
  using (true);
