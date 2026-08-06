-- Transactional RSVP write paths.
--
-- Both functions insert/update the parent row and all its child rows in a
-- single statement-level transaction, so a partial write (an rsvp with no
-- children, or orphaned children) is not reachable.
--
-- Headcount is ALWAYS recomputed here from the child rows and flags. The
-- client's number is never trusted, and is not even read.

-- ---------------------------------------------------------------------------
-- Headcount, computed one place only
-- ---------------------------------------------------------------------------

create or replace function public.compute_headcount(
  p_is_attending  boolean,
  p_has_plus_one  boolean,
  p_children      integer,
  p_has_nanny     boolean,
  p_nanny_count   integer
)
returns integer
language sql
immutable
as $$
  -- Mirrors calculateHeadcount() in types/rsvp.ts. Keep the two in step.
  select case
    when not p_is_attending then 0
    else 1
       + (case when p_has_plus_one then 1 else 0 end)
       + coalesce(p_children, 0)
       + (case when p_has_nanny then coalesce(p_nanny_count, 0) else 0 end)
  end;
$$;

comment on function public.compute_headcount is
  'Server-side mirror of calculateHeadcount() in types/rsvp.ts. The client''s '
  'headcount is never trusted; this is the only value written to the DB.';

-- ---------------------------------------------------------------------------
-- create_rsvp — insert, or update in place when the email already exists
-- ---------------------------------------------------------------------------

create or replace function public.create_rsvp(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email        text;
  v_attending    boolean;
  v_plus_one     boolean;
  v_has_nanny    boolean;
  v_nanny_count  integer;
  v_children     jsonb;
  v_child_count  integer;
  v_headcount    integer;
  v_existing_id  uuid;
  v_row          public.rsvps;
  v_is_duplicate boolean := false;
begin
  v_email     := lower(trim(payload ->> 'email'));
  v_attending := coalesce((payload ->> 'isAttending')::boolean, false);
  v_plus_one  := v_attending and coalesce((payload ->> 'hasPlusOne')::boolean, false);
  v_has_nanny := v_attending and coalesce((payload ->> 'hasNanny')::boolean, false);

  v_children := case
    when v_attending then coalesce(payload -> 'children', '[]'::jsonb)
    else '[]'::jsonb
  end;
  v_child_count := jsonb_array_length(v_children);

  v_nanny_count := case
    when v_has_nanny then coalesce((payload ->> 'nannyCount')::integer, 0)
    else 0
  end;

  v_headcount := public.compute_headcount(
    v_attending, v_plus_one, v_child_count, v_has_nanny, v_nanny_count
  );

  select id into v_existing_id from public.rsvps where email = v_email;
  v_is_duplicate := v_existing_id is not null;

  if v_is_duplicate then
    update public.rsvps set
      guest_full_name      = payload ->> 'guestFullName',
      phone                = payload ->> 'phone',
      is_attending         = v_attending,
      has_plus_one         = v_plus_one,
      plus_one_name        = case when v_plus_one then payload ->> 'plusOneName' else null end,
      children_count       = v_child_count,
      has_nanny            = v_has_nanny,
      nanny_count          = v_nanny_count,
      dietary_notes        = nullif(trim(coalesce(payload ->> 'dietaryNotes', '')), ''),
      message_to_celebrant = nullif(trim(coalesce(payload ->> 'messageToCelebrant', '')), ''),
      total_headcount      = v_headcount
    where id = v_existing_id
    returning * into v_row;

    -- Child rows are replaced wholesale rather than diffed: the form submits a
    -- complete list every time, so a diff would only add failure modes.
    delete from public.rsvp_children where rsvp_id = v_existing_id;
  else
    insert into public.rsvps (
      guest_full_name, email, phone,
      is_attending, has_plus_one, plus_one_name,
      children_count, has_nanny, nanny_count,
      dietary_notes, message_to_celebrant, total_headcount
    ) values (
      payload ->> 'guestFullName',
      v_email,
      payload ->> 'phone',
      v_attending,
      v_plus_one,
      case when v_plus_one then payload ->> 'plusOneName' else null end,
      v_child_count,
      v_has_nanny,
      v_nanny_count,
      nullif(trim(coalesce(payload ->> 'dietaryNotes', '')), ''),
      nullif(trim(coalesce(payload ->> 'messageToCelebrant', '')), ''),
      v_headcount
    )
    returning * into v_row;
  end if;

  if v_child_count > 0 then
    insert into public.rsvp_children (rsvp_id, age, gender)
    select
      v_row.id,
      (child ->> 'age')::integer,
      child ->> 'gender'
    from jsonb_array_elements(v_children) as child;
  end if;

  return jsonb_build_object(
    'id',             v_row.id,
    'editToken',      v_row.edit_token,
    'totalHeadcount', v_row.total_headcount,
    'isDuplicate',    v_is_duplicate,
    'createdAt',      v_row.created_at,
    'updatedAt',      v_row.updated_at
  );
end;
$$;

comment on function public.create_rsvp is
  'Atomically inserts an RSVP and its children, or updates in place when the '
  'email already exists. Returns isDuplicate so the UI can show the existing '
  '"already RSVP''d" panel. Headcount is recomputed, never taken from input.';

-- ---------------------------------------------------------------------------
-- update_rsvp_by_token — the guest edit flow
-- ---------------------------------------------------------------------------

create or replace function public.update_rsvp_by_token(p_token uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attending   boolean;
  v_plus_one    boolean;
  v_has_nanny   boolean;
  v_nanny_count integer;
  v_children    jsonb;
  v_child_count integer;
  v_headcount   integer;
  v_row         public.rsvps;
begin
  select * into v_row from public.rsvps where edit_token = p_token;

  if not found then
    -- Caller must not be able to distinguish "no such token" from "wrong
    -- token" — both surface as the same generic message in the UI.
    return jsonb_build_object('found', false);
  end if;

  v_attending := coalesce((payload ->> 'isAttending')::boolean, false);
  v_plus_one  := v_attending and coalesce((payload ->> 'hasPlusOne')::boolean, false);
  v_has_nanny := v_attending and coalesce((payload ->> 'hasNanny')::boolean, false);

  v_children := case
    when v_attending then coalesce(payload -> 'children', '[]'::jsonb)
    else '[]'::jsonb
  end;
  v_child_count := jsonb_array_length(v_children);

  v_nanny_count := case
    when v_has_nanny then coalesce((payload ->> 'nannyCount')::integer, 0)
    else 0
  end;

  v_headcount := public.compute_headcount(
    v_attending, v_plus_one, v_child_count, v_has_nanny, v_nanny_count
  );

  update public.rsvps set
    guest_full_name      = payload ->> 'guestFullName',
    phone                = payload ->> 'phone',
    is_attending         = v_attending,
    has_plus_one         = v_plus_one,
    plus_one_name        = case when v_plus_one then payload ->> 'plusOneName' else null end,
    children_count       = v_child_count,
    has_nanny            = v_has_nanny,
    nanny_count          = v_nanny_count,
    dietary_notes        = nullif(trim(coalesce(payload ->> 'dietaryNotes', '')), ''),
    message_to_celebrant = nullif(trim(coalesce(payload ->> 'messageToCelebrant', '')), ''),
    total_headcount      = v_headcount
  where id = v_row.id
  returning * into v_row;

  delete from public.rsvp_children where rsvp_id = v_row.id;

  if v_child_count > 0 then
    insert into public.rsvp_children (rsvp_id, age, gender)
    select
      v_row.id,
      (child ->> 'age')::integer,
      child ->> 'gender'
    from jsonb_array_elements(v_children) as child;
  end if;

  return jsonb_build_object(
    'found',          true,
    'id',             v_row.id,
    'editToken',      v_row.edit_token,
    'totalHeadcount', v_row.total_headcount,
    'updatedAt',      v_row.updated_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Execution grants
-- ---------------------------------------------------------------------------
--
-- These are SECURITY DEFINER and bypass RLS, so only service_role (the Edge
-- Functions) may call them. A browser holding the anon key must NOT be able to
-- invoke create_rsvp directly and skip server-side validation.

revoke all on function public.create_rsvp(jsonb)                 from public, anon, authenticated;
revoke all on function public.update_rsvp_by_token(uuid, jsonb)  from public, anon, authenticated;

grant execute on function public.create_rsvp(jsonb)                to service_role;
grant execute on function public.update_rsvp_by_token(uuid, jsonb) to service_role;
