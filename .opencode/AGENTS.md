# Collabify Agent Rules

Collabify is a Philippines-only platform connecting content creators/vloggers and businesses/brands for collaborations, x-deals, paid campaigns, appointments, messaging, calls, and future mobile support.

Stack:
- React JS + Vite
- TailwindCSS
- lucide-react
- react-redux / Redux Toolkit
- React Router
- Supabase Auth/Postgres/Storage/Realtime/Edge Functions

Hard rules:
1. Never rely on frontend-only authorization.
2. Every sensitive table must have RLS.
3. Every storage bucket must have explicit policies.
4. Never expose Supabase service role keys to React.
5. Admin role must not be assignable from frontend.
6. Verification files are private.
7. Messages, appointments, campaigns, offers, and contracts are participant-only.
8. Exact location data is private.
9. PH-only access must use layered controls and never claim perfect VPN blocking.
10. Sensitive changes must write audit logs.
