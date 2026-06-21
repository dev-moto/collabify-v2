-- Extend creator_profiles for showcase features:
--   availability_status, rate_card
-- Create portfolio_media table to track portfolio upload metadata.
-- Update public_creator_cards view to include new public-safe fields.

-- ============================================================
-- 1. Add columns to creator_profiles
-- ============================================================
alter table public.creator_profiles
  add column if not exists availability_status text
    check (availability_status in ('available', 'selective', 'unavailable')),

  add column if not exists rate_card text;

comment on column public.creator_profiles.availability_status is
  'Showcase visibility: available, selective, or unavailable for new collaborations.';
comment on column public.creator_profiles.rate_card is
  'Free-text rate card or pricing notes displayed on the public showcase.';

-- ============================================================
-- 2. Create portfolio_media table
-- ============================================================
create table if not exists public.portfolio_media (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  storage_bucket text not null default 'portfolio-media',
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now(),
  constraint portfolio_media_path_unique unique (storage_bucket, storage_path)
);

comment on table public.portfolio_media is
  'Metadata for portfolio media uploaded by creators. Actual files live in the portfolio-media storage bucket.';

-- Enable RLS
alter table public.portfolio_media enable row level security;

-- Policies: owner or admin can read/insert/delete
create policy "portfolio_media_owner_or_admin_select"
  on public.portfolio_media
  for select
  using (creator_id = auth.uid() or public.is_admin());

create policy "portfolio_media_owner_insert"
  on public.portfolio_media
  for insert
  with check (creator_id = auth.uid());

create policy "portfolio_media_owner_or_admin_delete"
  on public.portfolio_media
  for delete
  using (creator_id = auth.uid() or public.is_admin());

-- ============================================================
-- 3. Grant privileges
-- ============================================================
grant usage on schema public to authenticated;
grant all on public.portfolio_media to authenticated;

-- ============================================================
-- 4. Update public_creator_cards view to include new fields
-- ============================================================
create or replace view public.public_creator_cards as
select
  cp.id,
  p.display_name,
  coalesce(cp.city, p.city) as city,
  cp.bio,
  cp.niches,
  cp.is_discoverable,
  cp.updated_at,
  cp.availability_status,
  cp.rate_card
from public.creator_profiles cp
join public.profiles p on p.id = cp.id
where p.status = 'active'
  and cp.is_discoverable = true;
