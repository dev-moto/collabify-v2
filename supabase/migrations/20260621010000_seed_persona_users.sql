-- Seed creator and business persona users for local development and initial testing.
-- Creator: creator@collabify.app / Creator@123
-- Business: business@collabify.app / Business@123

-- Helper to safely create each persona user only if they don't already exist.
do $$
declare
  v_creator_id uuid;
  v_business_id uuid;
begin

  -- ============================================================
  -- Creator persona
  -- ============================================================
  if not exists (select 1 from auth.users where email = 'creator@collabify.app') then

    v_creator_id := gen_random_uuid();

    -- 1. Create the auth user record
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token, is_sso_user
    ) values (
      v_creator_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'creator@collabify.app',
      crypt('Creator@123', gen_salt('bf')),
      now(),
      '{"display_name": "Collabify Creator"}'::jsonb,
      now(),
      now(),
      '', '', '', '',
      false
    );

    -- 2. Create the identity record so email/password sign-in works
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      v_creator_id,
      v_creator_id,
      format('{"sub":"%s","email":"%s"}', v_creator_id, 'creator@collabify.app')::jsonb,
      'email',
      'creator@collabify.app',
      now(),
      now(),
      now()
    );

    -- 3. Create profile
    insert into public.profiles (id, role, display_name, city, onboarding_completed)
    values (v_creator_id, 'creator', 'Collabify Creator', 'Quezon City', true);

    -- 4. Create creator profile extension
    insert into public.creator_profiles (id, bio, niches, public_email, city)
    values (
      v_creator_id,
      'Content creator passionate about food, travel, and lifestyle. Open to brand collaborations.',
      array['food', 'travel', 'lifestyle'],
      'creator@collabify.app',
      'Quezon City'
    );

    raise notice 'Creator user created: creator@collabify.app / Creator@123';
  else
    raise notice 'Creator user already exists, skipping.';
  end if;

  -- ============================================================
  -- Business persona
  -- ============================================================
  if not exists (select 1 from auth.users where email = 'business@collabify.app') then

    v_business_id := gen_random_uuid();

    -- 1. Create the auth user record
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token, is_sso_user
    ) values (
      v_business_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'business@collabify.app',
      crypt('Business@123', gen_salt('bf')),
      now(),
      '{"display_name": "Collabify Business"}'::jsonb,
      now(),
      now(),
      '', '', '', '',
      false
    );

    -- 2. Create the identity record so email/password sign-in works
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      v_business_id,
      v_business_id,
      format('{"sub":"%s","email":"%s"}', v_business_id, 'business@collabify.app')::jsonb,
      'email',
      'business@collabify.app',
      now(),
      now(),
      now()
    );

    -- 3. Create profile
    insert into public.profiles (id, role, display_name, city, onboarding_completed)
    values (v_business_id, 'business', 'Collabify Business', 'Makati', true);

    -- 4. Create business profile extension (start unsubmitted; trigger prevents 'approved')
    insert into public.business_profiles (id, business_name, industry, city, verification_status)
    values (
      v_business_id,
      'Collabify Business Co.',
      'Marketing & Advertising',
      'Makati',
      'unsubmitted'
    );

    -- 5. Bypass the verification-status trigger by authenticating as admin
    perform set_config('request.jwt.claim.sub',
      (select id::text from auth.users where email = 'admin@collabify.app' limit 1),
      true
    );

    update public.business_profiles
    set verification_status = 'approved'
    where id = v_business_id;

    raise notice 'Business user created: business@collabify.app / Business@123 (pre-verified)';
  else
    raise notice 'Business user already exists, skipping.';
  end if;

end;
$$;
