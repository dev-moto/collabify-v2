-- Seed a default admin user for local development and initial setup.
-- Email:    admin@collabify.app
-- Password: Admin@123
--
-- Run this migration via Supabase CLI:
--   supabase migration up
-- Or apply it from the Supabase dashboard SQL editor (service_role required).

-- Helper to safely create the admin user only if it doesn't already exist.
do $$
declare
  v_user_id uuid;
  v_email text := 'admin@collabify.app';
begin
  -- Skip if admin already exists
  if exists (select 1 from auth.users where email = v_email) then
    raise notice 'Admin user % already exists, skipping.', v_email;
    return;
  end if;

  -- 1. Create the auth user record
  v_user_id := gen_random_uuid();

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    is_sso_user
  ) values (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    crypt('Admin@123', gen_salt('bf')),
    now(),
    '{"display_name": "Collabify Admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    false
  );

  -- 2. Create the identity record so email/password sign-in works
  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    v_user_id,
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id, v_email)::jsonb,
    'email',
    v_email,
    now(),
    now(),
    now()
  );

  -- 3. Grant admin role in public.user_roles
  insert into public.user_roles (user_id, role)
  values (v_user_id, 'admin');

  -- 4. Create a minimal profile (profile is required by profiles RLS; role 'creator'/'business'
  --    is the enum but admin doesn't use profile role for authorization — is_admin() checks user_roles)
  insert into public.profiles (id, role, display_name)
  values (v_user_id, 'creator', 'Collabify Admin');

  raise notice 'Admin user created: % / Admin@123', v_email;
end;
$$;
