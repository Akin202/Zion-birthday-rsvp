-- Local development seed.
--
-- Replaces the deleted lib/mock-data.ts: the admin screens need realistic data
-- to be worth looking at, but it now lives in the database rather than the
-- client bundle. Applied automatically by `supabase db reset`.
--
-- NOT applied to production — `supabase db push` only runs migrations.
--
-- Deliberately varied: 0-4 children, mixed ages and genders, some nannies,
-- some plus-ones, two declines, three already checked in, several dietary
-- notes, and one guest with a comma in their note to exercise CSV escaping.

do $$
declare
  v_id uuid;
begin
  -- 1. Attending, plus-one, 2 children, 1 nanny, dietary note, checked in
  select (public.create_rsvp('{
    "guestFullName": "Akinola Adebayo", "email": "akin.adebayo@example.com",
    "phone": "+2348023456781", "isAttending": true,
    "hasPlusOne": true, "plusOneName": "Funmi Adebayo",
    "children": [{"id":"c1","age":7,"gender":"male"},{"id":"c2","age":5,"gender":"female"}],
    "hasNanny": true, "nannyCount": 1,
    "dietaryNotes": "Peanut allergy for the older child",
    "messageToCelebrant": "Happy 7th Birthday Zion! Excited to celebrate with you!"
  }'::jsonb) ->> 'id')::uuid into v_id;
  update public.rsvps set checked_in = true, checked_in_at = now() - interval '2 hours',
    actual_headcount = 5 where id = v_id;

  -- 2. Attending, 4 children, no plus-one, 2 nannies
  perform public.create_rsvp('{
    "guestFullName": "Chiamaka Okafor", "email": "chiamaka.okafor@example.com",
    "phone": "+2348034567892", "isAttending": true,
    "hasPlusOne": false, "plusOneName": "",
    "children": [
      {"id":"c1","age":11,"gender":"female"}, {"id":"c2","age":9,"gender":"male"},
      {"id":"c3","age":6,"gender":"female"}, {"id":"c4","age":3,"gender":"male"}
    ],
    "hasNanny": true, "nannyCount": 2,
    "dietaryNotes": "No pork, halal only",
    "messageToCelebrant": "The kids have been counting down for weeks!"
  }'::jsonb);

  -- 3. Attending alone
  perform public.create_rsvp('{
    "guestFullName": "Tunde Bakare", "email": "tunde.bakare@example.com",
    "phone": "+2348045678903", "isAttending": true,
    "hasPlusOne": false, "plusOneName": "", "children": [],
    "hasNanny": false, "nannyCount": 0,
    "dietaryNotes": "", "messageToCelebrant": "Wishing Zion a wonderful day."
  }'::jsonb);

  -- 4. Declined
  perform public.create_rsvp('{
    "guestFullName": "Ngozi Eze", "email": "ngozi.eze@example.com",
    "phone": "+2348056789014", "isAttending": false,
    "hasPlusOne": false, "plusOneName": "", "children": [],
    "hasNanny": false, "nannyCount": 0, "dietaryNotes": "",
    "messageToCelebrant": "So sorry to miss it — we will be travelling. Have a wonderful party!"
  }'::jsonb);

  -- 5. Attending, plus-one, 1 child, checked in with a headcount mismatch
  select (public.create_rsvp('{
    "guestFullName": "Emeka Nwosu", "email": "emeka.nwosu@example.com",
    "phone": "+2348067890125", "isAttending": true,
    "hasPlusOne": true, "plusOneName": "Adaeze Nwosu",
    "children": [{"id":"c1","age":8,"gender":"male"}],
    "hasNanny": false, "nannyCount": 0,
    "dietaryNotes": "Vegetarian, no eggs",
    "messageToCelebrant": "Happy birthday big man!"
  }'::jsonb) ->> 'id')::uuid into v_id;
  update public.rsvps set checked_in = true, checked_in_at = now() - interval '1 hour',
    actual_headcount = 4 where id = v_id;

  -- 6. Attending, 3 children, 1 nanny, checked in
  select (public.create_rsvp('{
    "guestFullName": "Folasade Adeyemi", "email": "folasade.adeyemi@example.com",
    "phone": "+2348078901236", "isAttending": true,
    "hasPlusOne": false, "plusOneName": "",
    "children": [
      {"id":"c1","age":12,"gender":"female"}, {"id":"c2","age":10,"gender":"female"},
      {"id":"c3","age":4,"gender":"male"}
    ],
    "hasNanny": true, "nannyCount": 1,
    "dietaryNotes": "", "messageToCelebrant": ""
  }'::jsonb) ->> 'id')::uuid into v_id;
  update public.rsvps set checked_in = true, checked_in_at = now() - interval '30 minutes',
    actual_headcount = 5 where id = v_id;

  -- 7. Attending, 2 children, comma in the dietary note (CSV escaping probe)
  perform public.create_rsvp('{
    "guestFullName": "Ibrahim Sani", "email": "ibrahim.sani@example.com",
    "phone": "+2348089012347", "isAttending": true,
    "hasPlusOne": false, "plusOneName": "",
    "children": [{"id":"c1","age":6,"gender":"male"},{"id":"c2","age":2,"gender":"female"}],
    "hasNanny": false, "nannyCount": 0,
    "dietaryNotes": "No nuts, no shellfish, lactose intolerant",
    "messageToCelebrant": "See you there!"
  }'::jsonb);

  -- 8. Declined, no message
  perform public.create_rsvp('{
    "guestFullName": "Yewande Ogunleye", "email": "yewande.ogunleye@example.com",
    "phone": "+2348090123458", "isAttending": false,
    "hasPlusOne": false, "plusOneName": "", "children": [],
    "hasNanny": false, "nannyCount": 0, "dietaryNotes": "", "messageToCelebrant": ""
  }'::jsonb);

  -- 9. Attending, plus-one, 1 toddler
  perform public.create_rsvp('{
    "guestFullName": "Segun Oladipo", "email": "segun.oladipo@example.com",
    "phone": "+2347012345679", "isAttending": true,
    "hasPlusOne": true, "plusOneName": "Bisi Oladipo",
    "children": [{"id":"c1","age":1,"gender":"female"}],
    "hasNanny": true, "nannyCount": 1,
    "dietaryNotes": "Baby food for the little one",
    "messageToCelebrant": "Congratulations Zion!"
  }'::jsonb);

  -- 10. Attending, 2 school-age children
  perform public.create_rsvp('{
    "guestFullName": "Amaka Obi", "email": "amaka.obi@example.com",
    "phone": "+2349012345670", "isAttending": true,
    "hasPlusOne": false, "plusOneName": "",
    "children": [{"id":"c1","age":9,"gender":"female"},{"id":"c2","age":7,"gender":"male"}],
    "hasNanny": false, "nannyCount": 0,
    "dietaryNotes": "", "messageToCelebrant": "Have the best day ever!"
  }'::jsonb);

  -- 11. Attending, large family
  perform public.create_rsvp('{
    "guestFullName": "Kunle Balogun", "email": "kunle.balogun@example.com",
    "phone": "+2348101234561", "isAttending": true,
    "hasPlusOne": true, "plusOneName": "Ronke Balogun",
    "children": [
      {"id":"c1","age":14,"gender":"male"}, {"id":"c2","age":11,"gender":"female"},
      {"id":"c3","age":8,"gender":"male"}
    ],
    "hasNanny": true, "nannyCount": 1,
    "dietaryNotes": "One child is gluten free",
    "messageToCelebrant": "The whole house is coming!"
  }'::jsonb);

  -- 12. Attending alone, no extras
  perform public.create_rsvp('{
    "guestFullName": "Blessing Udoh", "email": "blessing.udoh@example.com",
    "phone": "+2348112345672", "isAttending": true,
    "hasPlusOne": false, "plusOneName": "", "children": [],
    "hasNanny": false, "nannyCount": 0,
    "dietaryNotes": "", "messageToCelebrant": "Happy birthday Zion, from Aunty Blessing."
  }'::jsonb);
end;
$$;
