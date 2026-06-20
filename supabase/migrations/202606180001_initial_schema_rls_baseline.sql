-- Collabify initial Supabase schema and RLS baseline.
-- MVP decisions:
-- - Business verification is required before outreach or campaign publishing.
-- - Discovery is city-level and public-safe.
-- - Messaging supports text and links only.
-- - Monetization is post-MVP/beta; only gates/placeholders are included here.

create extension if not exists pgcrypto;

create type public.account_role as enum ('creator', 'business');
create type public.account_status as enum ('active', 'suspended', 'deleted');
create type public.verification_status as enum ('unsubmitted', 'pending', 'approved', 'rejected');
create type public.campaign_status as enum ('draft', 'published', 'closed', 'cancelled');
create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'cancelled', 'completed');
create type public.appointment_status as enum ('requested', 'accepted', 'declined', 'rescheduled', 'cancelled', 'completed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.account_role not null,
  display_name text not null,
  city text,
  status public.account_status not null default 'active',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (length(trim(display_name)) > 0),
  constraint profiles_city_not_blank check (city is null or length(trim(city)) > 0)
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role = 'admin'),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = check_user_id
      and ur.role = 'admin'
  );
$$;

create table public.creator_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  niches text[] not null default '{}',
  public_email text,
  city text,
  is_discoverable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger creator_profiles_set_updated_at
before update on public.creator_profiles
for each row execute function public.set_updated_at();

create table public.business_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null,
  industry text,
  city text,
  verification_status public.verification_status not null default 'unsubmitted',
  is_discoverable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_profiles_name_not_blank check (length(trim(business_name)) > 0)
);

create trigger business_profiles_set_updated_at
before update on public.business_profiles
for each row execute function public.set_updated_at();

create or replace function public.is_verified_business(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_profiles bp
    where bp.id = check_user_id
      and bp.verification_status = 'approved'
  );
$$;

create or replace function public.prevent_business_verification_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin(auth.uid()) then
    return new;
  end if;

  if tg_op = 'INSERT' and new.verification_status not in ('unsubmitted', 'pending') then
    raise exception 'business verification status requires admin review';
  end if;

  if tg_op = 'UPDATE' and new.verification_status is distinct from old.verification_status then
    raise exception 'business verification status requires admin review';
  end if;

  return new;
end;
$$;

create trigger business_profiles_prevent_verification_self_change
before insert or update on public.business_profiles
for each row execute function public.prevent_business_verification_self_change();

create or replace function public.can_initiate_outreach(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case
      when p.role = 'business' then public.is_verified_business(check_user_id)
      else true
    end
    from public.profiles p
    where p.id = check_user_id
  ), false);
$$;

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  platform text not null,
  handle text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_accounts_platform_not_blank check (length(trim(platform)) > 0),
  constraint social_accounts_handle_not_blank check (length(trim(handle)) > 0),
  constraint social_accounts_url_check check (url ~* '^https?://')
);

create trigger social_accounts_set_updated_at
before update on public.social_accounts
for each row execute function public.set_updated_at();

create table public.stats_snapshots (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  platform text not null,
  follower_count integer check (follower_count is null or follower_count >= 0),
  engagement_rate numeric(5, 2) check (engagement_rate is null or engagement_rate >= 0),
  average_views integer check (average_views is null or average_views >= 0),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  storage_bucket text not null default 'verification-documents',
  storage_path text not null,
  document_type text not null,
  status public.verification_status not null default 'pending',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint verification_documents_path_unique unique (storage_bucket, storage_path)
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  title text not null,
  description text,
  city text,
  status public.campaign_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_title_not_blank check (length(trim(title)) > 0)
);

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  status public.offer_status not null default 'pending',
  private_terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  scheduled_for timestamptz,
  status public.appointment_status not null default 'requested',
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete set null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create or replace function public.is_conversation_participant(check_conversation_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = check_conversation_id
      and cp.user_id = check_user_id
  );
$$;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_body_not_blank check (length(trim(body)) > 0)
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id),
  reported_user_id uuid references auth.users(id),
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id),
  action text not null,
  target_user_id uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.plans (
  id text primary key,
  name text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text references public.plans(id),
  status text not null default 'inactive' check (status in ('inactive', 'trialing', 'active', 'past_due', 'cancelled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create index profiles_role_idx on public.profiles(role);
create index profiles_city_idx on public.profiles(city);
create index creator_profiles_city_idx on public.creator_profiles(city) where is_discoverable;
create index business_profiles_city_idx on public.business_profiles(city) where is_discoverable;
create index business_profiles_verification_status_idx on public.business_profiles(verification_status);
create index campaigns_business_status_idx on public.campaigns(business_id, status);
create index campaigns_city_status_idx on public.campaigns(city, status);
create index offers_business_creator_idx on public.offers(business_id, creator_id);
create index appointments_business_creator_idx on public.appointments(business_id, creator_id);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index audit_logs_actor_created_idx on public.audit_logs(actor_id, created_at);

create or replace view public.public_creator_cards as
select
  cp.id,
  p.display_name,
  coalesce(cp.city, p.city) as city,
  cp.bio,
  cp.niches,
  cp.is_discoverable,
  cp.updated_at
from public.creator_profiles cp
join public.profiles p on p.id = cp.id
where p.status = 'active'
  and cp.is_discoverable = true;

create or replace view public.public_business_cards as
select
  bp.id,
  bp.business_name,
  bp.industry,
  coalesce(bp.city, p.city) as city,
  bp.verification_status,
  bp.is_discoverable,
  bp.updated_at
from public.business_profiles bp
join public.profiles p on p.id = bp.id
where p.status = 'active'
  and bp.is_discoverable = true;

create or replace view public.public_campaign_cards as
select
  c.id,
  c.business_id,
  bp.business_name,
  c.title,
  c.description,
  c.city,
  c.created_at,
  c.updated_at
from public.campaigns c
join public.business_profiles bp on bp.id = c.business_id
where c.status = 'published'
  and bp.verification_status = 'approved';

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.social_accounts enable row level security;
alter table public.stats_snapshots enable row level security;
alter table public.verification_documents enable row level security;
alter table public.campaigns enable row level security;
alter table public.offers enable row level security;
alter table public.appointments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.consent_records enable row level security;
alter table public.audit_logs enable row level security;
alter table public.reports enable row level security;
alter table public.admin_actions enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles_select_self_or_admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_self" on public.profiles
for insert with check (id = auth.uid());
create policy "profiles_update_self_or_admin" on public.profiles
for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "user_roles_select_self_or_admin" on public.user_roles
for select using (user_id = auth.uid() or public.is_admin());

create policy "creator_profiles_select_owner_or_admin" on public.creator_profiles
for select using (id = auth.uid() or public.is_admin());
create policy "creator_profiles_insert_owner" on public.creator_profiles
for insert with check (id = auth.uid());
create policy "creator_profiles_update_owner_or_admin" on public.creator_profiles
for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "business_profiles_select_owner_or_admin" on public.business_profiles
for select using (id = auth.uid() or public.is_admin());
create policy "business_profiles_insert_owner" on public.business_profiles
for insert with check (id = auth.uid());
create policy "business_profiles_update_owner_or_admin" on public.business_profiles
for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "social_accounts_owner_or_admin_all" on public.social_accounts
for all using (creator_id = auth.uid() or public.is_admin()) with check (creator_id = auth.uid() or public.is_admin());

create policy "stats_snapshots_owner_or_admin_all" on public.stats_snapshots
for all using (creator_id = auth.uid() or public.is_admin()) with check (creator_id = auth.uid() or public.is_admin());

create policy "verification_documents_owner_or_admin_select" on public.verification_documents
for select using (business_id = auth.uid() or public.is_admin());
create policy "verification_documents_owner_insert" on public.verification_documents
for insert with check (business_id = auth.uid() and status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy "verification_documents_admin_update" on public.verification_documents
for update using (public.is_admin()) with check (public.is_admin());

create policy "campaigns_select_owner_published_or_admin" on public.campaigns
for select using (business_id = auth.uid() or status = 'published' or public.is_admin());
create policy "campaigns_business_insert" on public.campaigns
for insert with check (business_id = auth.uid() and (status <> 'published' or public.is_verified_business(auth.uid())));
create policy "campaigns_business_update_with_verification_gate" on public.campaigns
for update using (business_id = auth.uid() or public.is_admin())
with check ((business_id = auth.uid() or public.is_admin()) and (status <> 'published' or public.is_verified_business(business_id)));

create policy "offers_participant_or_admin_select" on public.offers
for select using (business_id = auth.uid() or creator_id = auth.uid() or public.is_admin());
create policy "offers_verified_business_or_creator_insert" on public.offers
for insert with check ((business_id = auth.uid() and public.is_verified_business(auth.uid())) or creator_id = auth.uid());
create policy "offers_participant_or_admin_update" on public.offers
for update using (business_id = auth.uid() or creator_id = auth.uid() or public.is_admin())
with check (business_id = auth.uid() or creator_id = auth.uid() or public.is_admin());

create policy "appointments_participant_or_admin_select" on public.appointments
for select using (business_id = auth.uid() or creator_id = auth.uid() or public.is_admin());
create policy "appointments_participant_insert" on public.appointments
for insert with check (created_by = auth.uid() and (business_id = auth.uid() or creator_id = auth.uid()));
create policy "appointments_participant_or_admin_update" on public.appointments
for update using (business_id = auth.uid() or creator_id = auth.uid() or public.is_admin())
with check (business_id = auth.uid() or creator_id = auth.uid() or public.is_admin());

create policy "conversations_participant_or_admin_select" on public.conversations
for select using (public.is_conversation_participant(id) or public.is_admin());
create policy "conversations_authenticated_insert" on public.conversations
for insert with check (created_by = auth.uid() and public.can_initiate_outreach(auth.uid()));
create policy "conversations_participant_or_admin_update" on public.conversations
for update using (public.is_conversation_participant(id) or public.is_admin())
with check (public.is_conversation_participant(id) or public.is_admin());

create policy "conversation_participants_participant_or_admin_select" on public.conversation_participants
for select using (public.is_conversation_participant(conversation_id) or public.is_admin());
create policy "conversation_participants_creator_insert" on public.conversation_participants
for insert with check (
  public.is_admin()
  or (
    user_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and c.created_by = auth.uid()
    )
  )
);

create policy "messages_participant_or_admin_select" on public.messages
for select using (public.is_conversation_participant(conversation_id) or public.is_admin());
create policy "messages_participant_sender_insert" on public.messages
for insert with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));

create policy "consent_records_self_or_admin_select" on public.consent_records
for select using (user_id = auth.uid() or public.is_admin());
create policy "consent_records_self_insert" on public.consent_records
for insert with check (user_id = auth.uid());

create policy "audit_logs_admin_select" on public.audit_logs
for select using (public.is_admin());
create policy "audit_logs_admin_insert" on public.audit_logs
for insert with check (public.is_admin());

create policy "reports_reporter_or_admin_select" on public.reports
for select using (reporter_id = auth.uid() or public.is_admin());
create policy "reports_authenticated_insert" on public.reports
for insert with check (reporter_id = auth.uid());
create policy "reports_admin_update" on public.reports
for update using (public.is_admin()) with check (public.is_admin());

create policy "admin_actions_admin_select" on public.admin_actions
for select using (public.is_admin());
create policy "admin_actions_admin_insert" on public.admin_actions
for insert with check (admin_id = auth.uid() and public.is_admin());

create policy "plans_active_select" on public.plans
for select using (is_active = true or public.is_admin());
create policy "plans_admin_all" on public.plans
for all using (public.is_admin()) with check (public.is_admin());

create policy "subscriptions_self_or_admin_select" on public.subscriptions
for select using (user_id = auth.uid() or public.is_admin());
create policy "subscriptions_admin_all" on public.subscriptions
for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('portfolio-media', 'portfolio-media', true),
  ('verification-documents', 'verification-documents', false),
  ('campaign-assets', 'campaign-assets', false)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
for select using (bucket_id = 'avatars');
create policy "avatars_owner_write" on storage.objects
for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_owner_update" on storage.objects
for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "portfolio_media_public_read" on storage.objects
for select using (bucket_id = 'portfolio-media');
create policy "portfolio_media_owner_write" on storage.objects
for insert with check (bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "verification_documents_owner_or_admin_read" on storage.objects
for select using (bucket_id = 'verification-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "verification_documents_owner_write" on storage.objects
for insert with check (bucket_id = 'verification-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "campaign_assets_participant_read" on storage.objects
for select using (bucket_id = 'campaign-assets' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
create policy "campaign_assets_verified_business_write" on storage.objects
for insert with check (bucket_id = 'campaign-assets' and (storage.foldername(name))[1] = auth.uid()::text and public.is_verified_business(auth.uid()));
