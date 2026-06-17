# Collabify Agent Rules

Collabify is a Philippines-only creator/business collaboration platform.

## Stack

Frontend:
- React JS with Vite
- TailwindCSS
- lucide-react
- react-redux / Redux Toolkit
- React Router
- Supabase JS client

Backend:
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions

## Hard Rules

1. No frontend-only authorization.
2. Every sensitive table must have RLS enabled.
3. Every storage bucket must have explicit policies.
4. Never expose Supabase service role key to React.
5. Every private query must be backed by an RLS policy.
6. Every collaboration, appointment, campaign, and message must check participant access.
7. Every business verification file must be private by default.
8. Sensitive location data must be approximate unless exact location is strictly needed.
9. PH-only access must be layered; do not claim 100% VPN blocking.
10. OpenCode must not run destructive bash commands without explicit approval.

## AI-DLC Flow

PRD → Threat Model → User Stories → Schema → RLS → UI → Tests → Security Review → Release.
