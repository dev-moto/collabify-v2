-- Collabify RLS baseline tests.
-- Run after local migrations with: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;

set search_path = public, extensions;

select plan(23);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'creator-a@example.test', 'test', now(), '{}', '{}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'creator-b@example.test', 'test', now(), '{}', '{}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'unverified-business@example.test', 'test', now(), '{}', '{}', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'verified-business@example.test', 'test', now(), '{}', '{}', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'admin@example.test', 'test', now(), '{}', '{}', now(), now());

insert into public.user_roles (user_id, role)
values ('55555555-5555-5555-5555-555555555555', 'admin');

insert into public.profiles (id, role, display_name, city, onboarding_completed)
values
  ('11111111-1111-1111-1111-111111111111', 'creator', 'Creator A', 'Quezon City', true),
  ('22222222-2222-2222-2222-222222222222', 'creator', 'Creator B', 'Makati', true),
  ('33333333-3333-3333-3333-333333333333', 'business', 'Unverified Business A', 'Manila', true),
  ('44444444-4444-4444-4444-444444444444', 'business', 'Verified Business B', 'Cebu City', true),
  ('55555555-5555-5555-5555-555555555555', 'creator', 'Admin User', 'Pasig', true);

insert into public.creator_profiles (id, bio, niches, public_email, city)
values
  ('11111111-1111-1111-1111-111111111111', 'Food and lifestyle creator', array['food', 'lifestyle'], 'public-creator-a@example.test', 'Quezon City'),
  ('22222222-2222-2222-2222-222222222222', 'Travel creator', array['travel'], 'public-creator-b@example.test', 'Makati');

insert into public.business_profiles (id, business_name, industry, city)
values
  ('33333333-3333-3333-3333-333333333333', 'Unverified Brand A', 'Retail', 'Manila'),
  ('44444444-4444-4444-4444-444444444444', 'Verified Brand B', 'Hospitality', 'Cebu City');

select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);
update public.business_profiles
set verification_status = 'approved'
where id = '44444444-4444-4444-4444-444444444444';

insert into public.campaigns (id, business_id, title, description, city, status)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'Published Cebu Campaign', 'Safe public campaign', 'Cebu City', 'published'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'Draft Manila Campaign', 'Private draft campaign', 'Manila', 'draft');

insert into public.offers (id, campaign_id, business_id, creator_id, private_terms)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Private offer terms');

insert into public.appointments (id, business_id, creator_id, scheduled_for, created_by, notes)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', now() + interval '7 days', '44444444-4444-4444-4444-444444444444', 'Private meeting details');

insert into public.conversations (id, campaign_id, created_by)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444');

insert into public.conversation_participants (conversation_id, user_id)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111');

insert into public.messages (id, conversation_id, sender_id, body)
values ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', 'Hello Creator A: https://example.test/brief');

insert into public.verification_documents (id, business_id, storage_path, document_type)
values ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333/sec-registration.pdf', 'sec_registration');

insert into public.audit_logs (actor_id, action, target_table, target_id)
values ('55555555-5555-5555-5555-555555555555', 'seed.audit', 'profiles', '11111111-1111-1111-1111-111111111111');

insert into public.admin_actions (admin_id, action, target_user_id)
values ('55555555-5555-5555-5555-555555555555', 'seed.admin_action', '11111111-1111-1111-1111-111111111111');

set local role authenticated;

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is((select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 1, 'creator can read own profile');
select is((select count(*)::int from public.profiles where id = '22222222-2222-2222-2222-222222222222'), 0, 'creator cannot read another private profile row');
select lives_ok($$ update public.profiles set display_name = 'Creator A Updated' where id = '11111111-1111-1111-1111-111111111111' $$, 'creator can update own profile');
select is((select count(*)::int from public.public_creator_cards where id = '11111111-1111-1111-1111-111111111111'), 1, 'public creator cards expose discoverable creator');
select ok(not exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'public_creator_cards' and column_name in ('public_email', 'status')), 'public creator cards exclude private contact/status columns');
select is((select count(*)::int from public.public_business_cards where id = '44444444-4444-4444-4444-444444444444'), 1, 'public business cards expose discoverable business');
select ok(not exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'public_business_cards' and column_name in ('reviewed_by', 'reviewed_at')), 'public business cards exclude review metadata columns');
select is((select count(*)::int from public.campaigns where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 0, 'creator cannot read private draft campaign');
select is((select count(*)::int from public.appointments where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'), 1, 'appointment participant can read appointment details');
select is((select count(*)::int from public.offers where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'), 1, 'offer participant can read private offer terms');
select is((select count(*)::int from public.messages where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'), 1, 'conversation participant can read messages');
select lives_ok($$ insert into public.messages (conversation_id, sender_id, body) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Thanks, received the link.') $$, 'participant can insert message as self');

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select is((select count(*)::int from public.conversations where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 0, 'non-participant cannot read conversation');
select is((select count(*)::int from public.messages where conversation_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 0, 'non-participant cannot read messages');
select throws_ok($$ insert into public.messages (conversation_id, sender_id, body) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'I should not send this.') $$, '42501', 'new row violates row-level security policy for table "messages"', 'non-participant cannot insert message');
select throws_ok($$ insert into public.conversation_participants (conversation_id, user_id) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222') $$, '42501', 'new row violates row-level security policy for table "conversation_participants"', 'user cannot add themselves to unrelated conversation');
select is((select count(*)::int from public.appointments where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'), 0, 'non-participant cannot read appointment details');
select is((select count(*)::int from public.offers where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'), 0, 'non-participant cannot read private offer terms');
select is((select count(*)::int from public.verification_documents where id = '99999999-9999-9999-9999-999999999999'), 0, 'unrelated user cannot read verification document metadata');
select is((select count(*)::int from public.audit_logs), 0, 'non-admin cannot read audit logs');
select is((select count(*)::int from public.admin_actions), 0, 'non-admin cannot read admin actions');

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);

select throws_ok($$ insert into public.campaigns (business_id, title, status) values ('33333333-3333-3333-3333-333333333333', 'Blocked Published Campaign', 'published') $$, '42501', 'new row violates row-level security policy for table "campaigns"', 'unverified business cannot publish a campaign');

select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);

select is((select count(*)::int from public.audit_logs), 1, 'admin can read audit logs');

select * from finish();

rollback;
