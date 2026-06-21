-- Seed base plan data and create a feature-gate helper for the
-- monetization MVP. Plans are seeded as idempotent inserts so
-- re-running is safe.

-- ============================================================
-- 1. Seed plans (idempotent)
-- ============================================================

insert into public.plans (id, name, is_active, metadata) values
  ('starter_creator', 'Starter Creator', true, '{"features": ["basic_profile", "social_links", "stats_entry", "portfolio_upload", "messaging", "appointments", "campaign_offers"]}'::jsonb),
  ('starter_business', 'Starter Business', true, '{"features": ["business_profile", "verification", "campaign_create", "messaging", "appointments", "offer_send", "creator_discovery"]}'::jsonb),
  ('pro_creator', 'Pro Creator', false, '{"features": ["all_starter", "advanced_analytics", "priority_support", "extended_portfolio"]}'::jsonb),
  ('pro_business', 'Pro Business', false, '{"features": ["all_starter", "advanced_analytics", "priority_support", "api_access"]}'::jsonb),
  ('enterprise', 'Enterprise', false, '{"features": ["all_pro", "dedicated_support", "custom_integrations", "audit_logs"]}'::jsonb)
on conflict (id) do update set
  name  = excluded.name,
  is_active = excluded.is_active,
  metadata  = excluded.metadata;

-- ============================================================
-- 2. Create feature gate RPC
-- ============================================================

create or replace function public.has_feature_access(
  check_user_id uuid default auth.uid(),
  feature text default ''
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.user_id = check_user_id
      and s.status in ('active', 'trialing')
      and p.is_active = true
      and p.metadata->'features' ? feature
  ) or exists (
    -- Users without a subscription have starter-level access
    select 1
    from public.profiles pr
    where pr.id = check_user_id
      and not exists (select 1 from public.subscriptions s where s.user_id = check_user_id and s.status in ('active', 'trialing'))
      and (
        (pr.role = 'creator' and feature in ('basic_profile', 'social_links', 'stats_entry', 'portfolio_upload', 'messaging', 'appointments', 'campaign_offers'))
        or
        (pr.role = 'business' and feature in ('business_profile', 'verification', 'campaign_create', 'messaging', 'appointments', 'offer_send', 'creator_discovery'))
      )
  );
$$;

grant execute on function public.has_feature_access to authenticated;
