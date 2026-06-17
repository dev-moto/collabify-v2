# Security Hardening Rules

## Secrets

- Never commit `.env`, Supabase service role keys, API secrets, OAuth client secrets, payment secrets, or private keys.
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` may exist in React frontend env.
- Supabase service role key may only be used in Supabase Edge Functions or secure server-side automation.

## Auth

- Enforce email verification before sensitive actions.
- Require role onboarding after signup.
- Store user role in a secure profile table and enforce role-specific RLS.
- Admin role must not be assignable by frontend users.
- Add login risk scoring for PH-only restriction.

## Authorization

- Frontend guards improve UX only.
- Real authorization must be enforced by Supabase RLS, storage policies, and Edge Functions.
- Use participant-based policies for messages, conversations, appointments, campaigns, and offers.

## Data Protection

- Minimize PII.
- Store consent records.
- Store audit logs for sensitive changes.
- Avoid exposing exact user coordinates publicly.
- Public profile views must use safe public fields only.
- Verification documents must be private and admin-only.

## Abuse Controls

- Rate-limit login, messaging, search, appointment creation, campaign creation, and file uploads.
- Detect spam patterns.
- Add reporting and moderation flows.
- Add blocklist support between users.

## PH-only Access

Layer controls:
1. GeoIP country allowlist.
2. PH mobile verification.
3. PH business verification.
4. VPN/datacenter/Tor detection.
5. Payment/billing signals such as GCash/Maya where applicable.
6. Ongoing risk scoring and admin review.

Never claim VPN blocking is perfect.
