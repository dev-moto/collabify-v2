# Collabify Frontend Plan

## Stack

- React JS
- Vite
- TailwindCSS
- lucide-react
- Redux Toolkit / react-redux
- React Router
- Supabase client

## MVP frontend scope

1. Public marketing and auth routes
2. Creator/business onboarding
3. Creator profile management
4. Business profile and verification submission
5. City-based discovery
6. Text/link messaging
7. Appointments
8. Business-created campaigns/x-deals
9. Admin verification/moderation surfaces
10. Monetization gate placeholders

## Architecture guidelines

- Use functional components.
- Use Redux Toolkit for global session/profile/app state.
- Use service modules for Supabase calls.
- Use React Router for route organization and route guards.
- Use TailwindCSS for styling and lucide-react for icons.
- Add loading, empty, error, and validation states for every data-dependent screen.
- Use accessible markup and keyboard-friendly interactions.

## Authorization rule

Frontend guards are UX only. Sensitive access must be enforced by Supabase RLS, storage policies, and Edge Functions.

## Initial route plan

- `/` public landing — implemented
- `/login` — implemented with validation and Supabase auth service call
- `/signup` — implemented with validation and Supabase auth service call
- `/forgot-password` — implemented with Supabase reset email service call
- `/verify-email` — implemented with resend verification UI
- `/onboarding` — implemented role selection UI
- `/creator/dashboard` — implemented mock workspace shell
- `/business/dashboard` — implemented mock workspace shell
- `/creators/:id` — implemented mock public-safe creator showcase
- `/businesses/:id` — implemented mock business profile
- `/discover/creators` — implemented mock public-safe discovery
- `/discover/businesses` — implemented mock public-safe discovery
- `/messages` — implemented realtime-ready mock UI
- `/appointments` — implemented mock appointment UI
- `/campaigns` — implemented mock campaign/x-deal UI
- `/settings` — implemented mock settings UI
- `/billing` — implemented monetization placeholder UI
- `/admin` — implemented admin-ready review center UI

## Environment variables

Only these Supabase variables are allowed in frontend code:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never expose service role keys in React.

## Current implementation status

- TailwindCSS is active through `@tailwindcss/vite` and `@import "tailwindcss"` in `app/app.css`.
- Global auth/session state is managed through Redux Toolkit in `app/store`.
- Supabase browser client lives in `app/lib/supabase.ts` and intentionally remains unconfigured unless both public Vite env vars are set.
- Supabase calls should stay in `app/services` or feature hooks; large UI route components should not directly embed data access logic.
- Current app pages use mock data from `app/data/mock.ts` until Supabase service modules are wired per feature.
