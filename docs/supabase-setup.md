# Supabase Setup Plan

## Goals

Set up Supabase as the secure backend for Collabify MVP using Auth, Postgres, Storage, Realtime, and Edge Functions where privileged actions are required.

## Environment variables

Frontend may use only:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never expose the Supabase service role key in React.

## Setup sequence

1. Create Supabase project.
2. Configure Auth providers and email settings.
3. Initialize local Supabase project structure.
4. Create migrations for extensions, enums, tables, indexes, functions, triggers, and RLS.
5. Create safe public views for discovery.
6. Create storage buckets and explicit policies.
7. Add Edge Functions for privileged workflows.
8. Enable realtime only for RLS-safe tables.
9. Add seed data for local development and RLS tests.
10. Run security/RLS review before frontend integration.

## Migration order

1. Extensions and enums
2. Helper functions such as `is_admin`, participant checks, and updated-at triggers
3. Identity/profile tables
4. Creator and business profile tables
5. Verification and audit tables
6. Discovery-safe public views
7. Campaign and offer tables
8. Conversation and message tables
9. Appointment tables
10. Consent, reports, moderation, and risk tables
11. Monetization placeholders
12. RLS policies
13. Storage policies
14. Seed data and tests

## Realtime plan

Realtime should be enabled only after RLS is validated for:

- messages
- conversations
- appointments
- offers/campaign status updates where participant or public visibility allows it

Do not enable realtime broadly for admin, risk, payment, or audit tables.

## Edge Function candidates

- verification review decisions
- admin role or claim management
- payment webhooks in post-MVP/beta
- PH-only risk scoring/session checks
- high-risk campaign, outreach, or messaging actions if rate limiting is needed

## Local development expectations

- Use migrations for schema changes.
- Add tests for RLS, storage policies, and sensitive workflows.
- Use seed users for creator, verified business, unverified business, and admin scenarios.
- Keep secrets outside source control.
