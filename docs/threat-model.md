# Collabify Threat Model

## Scope

This threat model covers the Collabify MVP: auth, profiles, verification, discovery, messaging, appointments, campaigns/x-deals, audit logs, moderation, and PH-only layered access controls.

## Sensitive assets

- Verification documents
- Exact location data
- Private messages and links
- Appointment details
- Campaign private notes and offer terms
- Payment/subscription identifiers for future monetization
- Personal contact information
- Admin actions and moderation records
- Consent records and audit logs
- Risk signals related to PH-only access

## Trust boundaries

- Browser/client application
- Supabase Auth
- Supabase Postgres with RLS
- Supabase Storage with explicit bucket policies
- Supabase Realtime
- Supabase Edge Functions for privileged actions
- Admin workflows
- GitHub Actions and deployment automation

## Threats and mitigations

### Frontend-only authorization bypass

- **Threat:** a user manipulates frontend state, routes, or API calls to access restricted data.
- **Mitigation:** enforce all sensitive access with RLS, storage policies, constraints, and Edge Functions.

### Business verification bypass

- **Threat:** unverified businesses initiate outreach or publish campaigns.
- **Mitigation:** require verified business status in database policies, mutations, and Edge Function checks.

### Private message exposure

- **Threat:** non-participants read messages or receive realtime events.
- **Mitigation:** conversation participant tables, participant-only RLS, realtime only on RLS-protected tables.

### Verification document leakage

- **Threat:** private business documents are publicly readable.
- **Mitigation:** private storage bucket, owner upload, admin review access, no public URLs, audit access decisions.

### Location privacy leakage

- **Threat:** exact locations are exposed through profiles or discovery.
- **Mitigation:** public discovery uses city-level data and safe public views; exact coordinates are private if collected.

### Role escalation

- **Threat:** user assigns themselves admin or privileged role.
- **Mitigation:** admin role controlled only by server-side privileged workflows; frontend cannot assign admin.

### Unsafe public views

- **Threat:** public profile/campaign views expose private fields.
- **Mitigation:** define explicit safe public views and review before beta.

### Abuse of messaging, search, campaigns, or appointments

- **Threat:** spam, scams, phishing links, scraping, or harassment.
- **Mitigation:** rate limits, reports, moderation queues, audit logs, and verification-gated business outreach.

### PH-only control bypass

- **Threat:** non-PH users bypass location restrictions through VPN or proxy.
- **Mitigation:** layered controls such as GeoIP, PH mobile/billing/business verification signals, VPN/datacenter/Tor risk scoring, and risk review. Do not promise perfect blocking.

### Secret leakage

- **Threat:** Supabase service role, payment keys, or tokens appear in frontend or repository.
- **Mitigation:** frontend uses only Supabase URL and anon key; service role limited to trusted server/Edge Function contexts; GitHub secret scanning and push protection.

## Security review checklist

- RLS enabled on every app table.
- Storage policies exist for every bucket.
- Public views exclude private fields.
- Admin role cannot be assigned from frontend.
- Verification status gates business outreach and campaign publishing.
- Realtime tables are safe under RLS.
- Audit logs cover sensitive writes.
- Rate limits are planned for high-abuse surfaces.
