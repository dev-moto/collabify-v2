# Collabify v2

Collabify is a Philippines-first creator collaboration marketplace for content creators, vloggers, brands, SMEs, and agencies. The MVP focuses on trusted business verification, city-based discovery, public-safe creator/business profiles, text/link messaging, appointments, and business-created campaigns or x-deals.

## Current status

- Planning docs are in place for the PRD, security baseline, threat model, Supabase setup, database design, and RLS policy matrix.
- Supabase schema, storage buckets, RLS policies, safe public discovery views, and baseline RLS tests are implemented.
- Frontend foundation is implemented with React Router, Vite, TailwindCSS, Redux Toolkit, Supabase client, and lucide-react.
- GitHub Project status is updated for the active MVP foundation issues.

See [`docs/progress.md`](docs/progress.md) for the latest progress notes.

## Tech stack

### Frontend

- React JS
- Vite / React Router
- TailwindCSS
- lucide-react
- Redux Toolkit / react-redux
- Supabase JS client

### Backend

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase RLS policies
- SQL-based pgtap RLS tests

## Project structure

```text
architecture/          Database design and RLS matrix
docs/                  Product, security, setup, and progress docs
frontend/              React/Vite frontend app
scripts/windows/       Local Windows helper scripts
supabase/              Supabase config, migrations, and tests
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

For Supabase-backed auth/API calls, create `frontend/.env` with public frontend values only:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never put a Supabase service role key in the frontend.

Useful frontend commands:

```bash
npm run typecheck
npm run build
```

## Supabase local setup

Run Supabase commands from the repository root:

```bash
npx supabase start
npx supabase db reset --debug
npx supabase test db --debug
```

The RLS baseline currently verifies 23 pgtap checks covering profile privacy, public-safe views, business verification gates, participant-only messages/appointments/offers, verification document privacy, and admin-only audit access.

## Security rules

- Supabase RLS is the source of truth for authorization.
- Frontend route guards are UX only.
- Public discovery must use safe public views.
- Exact coordinates must not be displayed publicly.
- Business verification is required before outreach or campaign publishing.
- MVP messaging supports text and links only.
- Do not commit secrets or service role keys.

## Key docs

- [`docs/prd.md`](docs/prd.md)
- [`docs/progress.md`](docs/progress.md)
- [`docs/security-baseline.md`](docs/security-baseline.md)
- [`docs/threat-model.md`](docs/threat-model.md)
- [`docs/supabase-setup.md`](docs/supabase-setup.md)
- [`architecture/database-design.md`](architecture/database-design.md)
- [`architecture/rls-policy-matrix.md`](architecture/rls-policy-matrix.md)
- [`frontend/README.md`](frontend/README.md)
- [`supabase/README.md`](supabase/README.md)

## MVP milestones

1. Planning gate approval — complete
2. Supabase schema/RLS baseline — complete
3. Frontend shell and auth onboarding — in progress
4. Business verification and admin audit baseline
5. Profiles and discovery
6. Messaging, appointments, campaigns
7. Compliance controls and beta hardening
