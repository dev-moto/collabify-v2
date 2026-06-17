# Security Hardening Rules

- Never commit `.env`, private keys, OAuth secrets, Supabase service role keys, payment keys, or tokens.
- Frontend may only use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Service role key only belongs in trusted server-side tooling or Supabase Edge Functions.
- Frontend guards are UX only; Supabase RLS is real authorization.
- Public profile views must use safe public fields.
- Verification docs are private and admin-only.
- Exact coordinates are private.
- Rate-limit login, messaging, search, appointments, campaigns, and uploads.
