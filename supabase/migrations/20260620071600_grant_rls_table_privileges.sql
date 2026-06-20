-- Grant base table/view privileges required for authenticated RLS policies.
-- RLS policies still determine which rows each user can access.

grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;

grant select, insert, update on public.creator_profiles to authenticated;
grant select, insert, update on public.business_profiles to authenticated;

grant select, insert, update, delete on public.social_accounts to authenticated;
grant select, insert, update, delete on public.stats_snapshots to authenticated;

grant select, insert, update on public.verification_documents to authenticated;
grant select, insert, update on public.campaigns to authenticated;
grant select, insert, update on public.offers to authenticated;
grant select, insert, update on public.appointments to authenticated;

grant select, insert, update on public.conversations to authenticated;
grant select, insert on public.conversation_participants to authenticated;
grant select, insert on public.messages to authenticated;

grant select, insert on public.consent_records to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant select, insert, update on public.reports to authenticated;
grant select, insert on public.admin_actions to authenticated;

grant select, insert, update, delete on public.plans to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;

grant select on public.public_creator_cards to anon, authenticated;
grant select on public.public_business_cards to anon, authenticated;
grant select on public.public_campaign_cards to anon, authenticated;
