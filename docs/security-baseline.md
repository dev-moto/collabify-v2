# Collabify Security Baseline

## Critical Security Decisions

1. Frontend is not trusted.
2. Supabase RLS is the primary authorization layer.
3. Storage files are private unless explicitly safe.
4. Admin actions are audited.
5. Business verification documents are private.
6. Exact location is not publicly exposed.
7. PH-only access is layered, not absolute.
8. Secrets are never stored in the repo.
9. GitHub Actions use least privilege.
10. AI agents require approval before file edits and bash operations.

## Supabase Checklist

- RLS enabled on all app tables
- Storage policies per bucket
- No service role key in frontend
- Edge Functions for privileged operations
- Audit log for sensitive actions
- Consent records
- Safe public views

## GitHub Checklist

- Branch protection
- Dependabot
- CodeQL
- Secret scanning
- Required PR reviews
- Required status checks
- Least-privilege workflow permissions

## PH-only Access

Use:
- Cloudflare WAF GeoIP allowlist
- VPN/datacenter/Tor risk detection
- PH phone verification
- Business DTI/SEC/BIR verification
- Payment identity signals where applicable
- Account risk scoring
