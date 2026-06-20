# Collabify Security Baseline

## Core rules

1. Never commit `.env`, private keys, OAuth secrets, Supabase service role keys, payment keys, or tokens.
2. React frontend may only use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Service role keys belong only in trusted server-side tooling or Supabase Edge Functions.
4. Frontend guards are UX only; Supabase RLS and storage policies are real authorization.
5. RLS must be enabled on every app table.
6. Every storage bucket must have explicit policies.
7. Public profile and campaign cards must use safe public views.
8. Verification documents are private and admin-only for review.
9. Exact coordinates are private.
10. Sensitive changes must write audit logs.

## Business verification gate

Businesses must be verified before they can:

- initiate outreach to creators
- publish campaigns
- create active x-deal opportunities

Verification decisions must be admin-controlled and auditable.

## Public data policy

Public discovery may expose:

- display name or brand name
- role/type
- city
- public bio/description
- approved categories/niches
- safe public social links
- safe public campaign card fields

Public discovery must not expose:

- email or phone
- exact coordinates
- verification documents or metadata that exposes private files
- payment identifiers
- private messages
- appointment details
- admin/risk/moderation notes

## Storage baseline

Planned buckets must have explicit policies before use:

- `avatars`: public read if approved; owner write.
- `portfolio-media`: public or moderated read; owner write.
- `verification-documents`: private; owner upload/read own status; admin review.
- `campaign-assets`: owner write; public only for published campaigns if approved.
- Future `message-attachments`: deferred until post-MVP.

## Rate-limit surfaces

Plan rate limits for:

- login/signup
- messaging
- discovery/search
- appointment requests
- campaign publishing
- uploads
- verification submissions

## GitHub security baseline

- Branch protection on `main`
- Required PR reviews
- Required CI checks
- Conversation resolution before merge
- Dependabot enabled
- Secret scanning and push protection enabled
- CodeQL enabled
- GitHub Actions default to least privilege permissions

## Beta readiness checklist

- RLS reviewed table-by-table.
- Storage policies reviewed bucket-by-bucket.
- Public views reviewed for private field leakage.
- No service role key exists in frontend code.
- Sensitive workflows have audit logs.
- PH-only product copy avoids perfect-blocking claims.
