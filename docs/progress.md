# Collabify Progress Update

Last updated: 2026-06-21

## Current status

Collabify has moved from planning into active implementation. The secure Supabase baseline is in place, the frontend app shell is connected to Supabase-backed service modules for key MVP surfaces, and the current frontend quality gate is green.

## Completed

### Planning foundation

- Product vision, PRD, threat model, security baseline, Supabase setup plan, database design, and RLS policy matrix are documented.
- GitHub issue sequence exists for MVP delivery.

### Supabase schema and RLS baseline

- Initial Supabase schema, enums, triggers, indexes, safe public views, storage buckets, storage policies, and RLS policies are implemented in migrations.
- Added base table/view grants required for authenticated users so RLS policies can evaluate correctly.
- Automated RLS baseline test now passes locally:

```bash
npx supabase test db --debug
```

Latest verified result:

```text
Files=1, Tests=23
Result: PASS
```

### Frontend shell and auth/onboarding foundation

- React Router + Vite + TailwindCSS app is set up.
- Added planned frontend dependencies: Supabase client, Redux Toolkit, react-redux, and lucide-react.
- Added a modern responsive landing page as `/`.
- Added auth/onboarding routes:
  - `/login`
  - `/signup`
  - `/forgot-password`
  - `/verify-email`
  - `/onboarding`
- Added Supabase browser client guard that uses only:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Added Redux session foundation and protected route wrapper.
- Added role-based app shell, public shell, protected routes, notification bell placeholder, and user menu.
- Moved Billing from the top navbar into the user menu for creator/business accounts only; Billing is not shown for admin accounts.
- Added auth-aware home CTAs and onboarding fallback behavior.
- Frontend typecheck/build has passed after the expanded route/auth implementation:

```bash
npm run typecheck && npm run build
```

Latest verified frontend quality gate:

```text
npm test        -> 318 tests passed across 24 files
npm run typecheck -> PASS
npm run build     -> PASS
```

### Supabase-backed frontend integration

- Replaced mock-data usage with Supabase service modules for discovery, messages, campaigns, appointments, admin, profile, and verification workflows.
- Connected discover creators/businesses, profile pages, messages, campaigns, appointments, settings, admin, creator dashboard, and business dashboard to Supabase services with loading, empty, and error states.
- Added private business verification document upload flow and admin verification review UX.
- Added participant display-name resolution for conversations via `get_participant_profiles` security-definer RPC.
- Added admin seed migration for the default local admin user.

### Frontend tests and quality fixes

- Added route, component, and service tests covering auth/navigation, user menu, notification bell, app shell, business verification, discovery, campaigns, appointments, admin, messages, and service modules.
- Fixed completed code review findings tracked in GitHub:
  - #16 Unused `User` import in messages route — closed.
  - #17 Swallowed `getMessages` error state — closed.
  - #18 Discover businesses search button no-op — closed.
  - #19 Frontend TypeScript typecheck failures — closed.
  - #21 Billing route test coverage and role-aware Billing shell — closed.

## In progress

- #14 Create admin moderation and audit logs — moved to In progress on the Collabify Project, assigned to `dev-moto`, P1/M/estimate 3, target 2026-06-22.
- #34 Fix admin route tests after admin dashboard navigation refactor — created and added to the Collabify Project as Ready, assigned to `dev-moto`, P1/S/estimate 2, target 2026-06-21.

## Latest Project status update

Current GitHub Project alignment after the latest sync:

| Issue(s) | Project status | Notes |
| --- | --- | --- |
| #4-#13 | Done | Core MVP setup, auth/onboarding, profiles, verification, discovery, appointments, messaging, campaigns, and monetization-gate foundation are complete on the board. |
| #14 | In progress | Admin moderation/audit is the active MVP focus; validation is blocked by failing admin route tests tracked in #34. |
| #15 | Backlog | Security hardening remains the final pre-beta gate. |
| #27 | Done | Role-specific `ProtectedRoute` gating closed after targeted verification. |
| #34 | Ready | New P1 follow-up for admin test failures found during targeted validation. |

## Current opencode work snapshot

| Work item | Scope | Status | Notes |
| --- | --- | --- | --- |
| GitHub issue #16 | `messages.tsx` cleanup | Done | Closed and synced to project. |
| GitHub issue #17 | Messages loading/error UX | Done | Closed and synced to project. |
| GitHub issue #18 | Discover businesses search behavior | Done | Closed and synced to project. |
| GitHub issue #19 | Frontend typecheck failures | Done | Closed, assigned to `dev-moto`, added to Collabify project, and moved Ready → In progress → In review → Done. |
| GitHub issue #21 | Billing route test coverage | Done | Added protected-route and authenticated creator/business Billing coverage; fixed Billing route shell role inference. |
| Billing menu move | `AppShell`, `UserMenu`, tests | Done | Billing now appears under user menu for creator/business only; hidden for admin. |
| Functional/non-functional validation | Frontend tests/typecheck/build | Done | `npm test`, `npm run typecheck`, and `npm run build` all pass with 318 tests across 24 files. |
| Progress documentation | `docs/progress.md` | Updated | Local OpenCode progress aligned with GitHub issue/project state as of 2026-06-21. |
| Realtime docs dashboard server | `scripts/docs-dashboard-server.mjs`, `docs/opencode-work-dashboard.html` | Done | Serves the docs dashboard over localhost/Tailscale, streams Server-Sent Events when `docs/progress.md` or `opencode.json` changes, and animates the working OpenCode agents from `opencode.json`. Updated to the dark AI-DLC dashboard mockup with metrics, workflow cards, activity, timeline, and throughput visuals. Verified locally on port 4174. |
| Dashboard UI overlap/performance fix | `docs/opencode-work-dashboard.html` | Done | Removed overlap-prone fixed sizing and shifted cards, made the layout responsive with auto-fit grids, reduced repaint-heavy animations, added reduced-motion support, and slowed simulated activity updates. Verified locally on port 4174. |
| Dashboard CTA and realtime agent logs | `docs/opencode-work-dashboard.html`, `scripts/docs-dashboard-server.mjs` | Done | Sidebar pages, topbar CTAs, panel controls, export, filtering, refresh, and visitable sections are wired. Server now emits per-agent realtime log groups from `opencode.json` plus current progress data; the UI refreshes agent logs over SSE. Verified locally on port 4174. |
| Reusable OpenCode dashboard rebrand | `docs/opencode-work-dashboard.html`, `scripts/docs-dashboard-server.mjs` | Done | Rebranded the dashboard from Collabify-specific copy to a reusable OpenCode project dashboard, added visible notification/help popovers, generic export naming, realtime terminal lines inside each agent card, and unified agent-card spacing. Verified locally on port 4174. |
| Dashboard UI/UX workflow connections | `docs/opencode-work-dashboard.html` | Done | Tightened sidebar/topbar/dashboard spacing, reduced overflow-prone widths, normalized agent card internals, and added SVG workflow connection lines between visible agents when Workflow View is selected. Grid View hides the connection layer. Verified locally on port 4174. |
| Dashboard persona-specific agent icons | `docs/opencode-work-dashboard.html` | Done | Added `iconForAgent()` mapping function that assigns distinct Lucide-style SVG icons per agent persona (code→build/frontend, searchCode→explore, lightbulb→plan, database→architect, shield→security, testTube→testing, chart→monetization, settings→customize, bot→fallback). Agent cards now show their persona icon instead of the generic robot icon. Issue #28 closed. |
| Dashboard realtime sparkline graphs | `docs/opencode-work-dashboard.html`, `scripts/docs-dashboard-server.mjs` | Done | Server generates 14-point time-series per agent that changes on each SSE poll; client renders inline SVG `<polyline>` sparklines scaled to data min/max. Falls back to client-side generation when server is offline. Issue #29 closed. |
| Dashboard workflow zoom and auto-fit | `docs/opencode-work-dashboard.html` | Done | Added sticky zoom toolbar ( − / Fit / + ) in Workflow View. Canvas renders in a `transform: scale(Z)` layer with scrollable overflow. Drag and connection-line coordinates are zoom-aware (divide pointer deltas by zoom). Auto-fits all cards on first load and when switching from Grid to Workflow View. Grid View resets the scale transform. Issue #30 assigned to dev-moto. |
| Dashboard dynamic workflow links | `docs/opencode-work-dashboard.html` | Done | Replaced one-sided source-right → target-left links with dynamic anchor selection. Links now choose left/right/top/bottom card edges based on relative card position and render curved paths from the chosen source side to the chosen target side. Compatible with zoomed and draggable Workflow View. Issue #32 closed. |
| Dashboard accurate Active Agents progress | `docs/opencode-work-dashboard.html`, `scripts/docs-dashboard-server.mjs` | Done | Server now derives each agent's `currentTask`, `progress`, `workStatus`, `lastActivity`, and related work count from `docs/progress.md` using agent-specific keyword matching. Active Agent cards render those fields for status rings, task text, footer state, and realtime terminal logs instead of static placeholders. Issue #33 closed. |
| Dashboard metric card height fix | `docs/opencode-work-dashboard.html` | Done | Reduced the Overview metric cards to compact fixed 124px rows, disabled stretch behavior with `align-self: start`, and kept the bottom sparkline visible without excessive empty vertical space. Issue #35 closed. |
| Dashboard metrics-to-agents gap fix | `docs/opencode-work-dashboard.html` | Done | Removed the large blank gap between the top metric cards and Active Agents by top-aligning the dashboard grid and packing `.main-col` rows with `align-content: start` plus `grid-auto-rows: max-content`. Issue #38 closed. |

Dashboard implementation has progressed for creator/business/admin surfaces but should still be reviewed against the open GitHub epics before closing them.

Docs-only visual dashboard:

```text
docs/opencode-work-dashboard.html
```

Open this file directly for a static snapshot, or serve it locally with realtime docs and OpenCode agent updates:

```bash
node scripts/docs-dashboard-server.mjs --host 0.0.0.0 --port 4174
```

Then visit `http://localhost:4174` or `http://<tailscale-device-name-or-ip>:4174` from another Tailscale-connected device. The browser subscribes to Server-Sent Events and refreshes when `docs/progress.md` or `opencode.json` changes.

## Environment note

For local frontend auth/API calls, create `frontend/.env` with local or hosted Supabase public values:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never add a service role key to the frontend.

## Next recommended work

See `docs/roadmap.md` for the GitHub Project-aligned roadmap snapshot and execution sequence.

1. Fix #34 so the expanded admin route test suite matches the current admin dashboard/navigation behavior.
2. Finish #14 admin moderation/audit validation, then move it to In review/Done only after tests pass.
3. Run #15 beta hardening after admin validation, including focused security/RLS review of latest migrations and Supabase service usage.
4. Keep monetization beyond the existing #13 feature-gate foundation deferred until after MVP validation; do not add full billing/subscription processing yet.
5. Prepare a small, reviewable commit/PR plan because the working tree contains broad frontend, docs-dashboard, and admin changes.
