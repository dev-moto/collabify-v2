# Supabase Rules

## Required

- Enable RLS on every app table.
- Use `auth.uid()` in policies.
- Use `security definer` functions carefully.
- Avoid broad policies like `using (true)` except for safe public views.
- Public creator/business cards should come from safe views, not raw tables.
- Storage buckets must have policies.
- Realtime must only expose rows users can read.
- Use Edge Functions for privileged operations.

## Tables Requiring Strict RLS

- profiles
- creator_profiles
- business_profiles
- creator_social_accounts
- social_stats_snapshots
- business_verification_documents
- locations
- conversations
- conversation_participants
- messages
- appointments
- campaigns
- campaign_offers
- subscriptions
- payments
- consent_records
- audit_logs
- reports
- admin_actions

## Storage Buckets

- avatars: public read only for sanitized avatar paths
- creator-media: public/profile-controlled with moderation
- business-documents: private, owner upload, admin read
- campaign-assets: participants only
- chat-files: conversation participants only
- contracts: campaign participants and admins only
