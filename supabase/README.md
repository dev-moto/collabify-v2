# Collabify Supabase Plan

## Scope

Supabase provides Auth, Postgres, Storage, Realtime, and Edge Functions for Collabify.

## Security-first rules

- Enable RLS on every app table.
- Use `auth.uid()` and helper functions in policies.
- Use storage policies for every bucket.
- Use safe public views for discovery cards.
- Use Edge Functions for privileged actions.
- Never expose the service role key to React.
- Realtime must only expose rows the user can read.

## Planned folders

```text
supabase/
  migrations/
  functions/
  seed.sql
  config.toml
```

## Migration plan

1. Extensions, enums, and helper functions
2. Profiles and role tables
3. Creator and business profiles
4. Verification documents and audit logs
5. Campaigns, offers, appointments
6. Conversations, participants, messages
7. Consent records, reports, admin actions, risk signals
8. Monetization placeholders
9. RLS policies
10. Storage buckets and policies
11. Seed data and RLS tests

## MVP storage buckets

- `avatars`
- `portfolio-media`
- `verification-documents`
- `campaign-assets`

`message-attachments` is deferred because MVP messaging supports text and links only.

## Required test coverage

- owner profile access
- safe public view exposure
- verification document privacy
- business verification gates
- participant-only messages
- participant-only appointments
- campaign publishing rules
- admin-only audit/moderation access

## Current implementation status

- Initial schema/RLS/storage baseline is implemented in migrations.
- Safe public views exist for creator, business, and campaign discovery cards.
- Base grants for authenticated users were added so RLS policies can be evaluated by Postgres.
- Automated RLS baseline is passing locally with 23 pgtap checks.
- Frontend integration should use the safe public views for discovery and should never bypass RLS with privileged keys.
