# Collabify Roadmap

Last updated: 2026-06-21  
Source of truth: [GitHub Project: Collabify](https://github.com/users/dev-moto/projects/1) and MVP planning docs.

## Snapshot

Collabify is in active MVP implementation. The Supabase schema/RLS baseline is complete, frontend shell and auth/onboarding are done, and the remaining MVP epics are queued in the Collabify GitHub Project.

| Phase | Project items | Status | Outcome |
| --- | --- | --- | --- |
| 0. Planning and security baseline | #5, docs/architecture/security planning | Done | Approved product/security foundation, database design, RLS matrix, migrations, storage policies, and passing RLS baseline tests. |
| 1. Frontend shell and onboarding | #4, #6 | Done | React/Vite/Tailwind app shell, Supabase client, Redux session state, protected routes, auth screens, onboarding, role-aware navigation, persona seed users. |
| 2. Profiles, verification, and discovery | #7, #8, #9 | In progress | Creator/business profiles, mandatory business verification, private verification files, admin review, safe city-based discovery. |
| 3. Collaboration workflows | #10, #11, #12 | Backlog | Participant-only messaging, appointments, business-created campaigns, x-deals, and offer workflows. |
| 4. Admin, monetization gates, and beta hardening | #13, #14, #15 | Backlog | Monetization gate foundations, moderation/audit tools, RLS/storage/security review, dependency/secret scanning, privacy hardening. |

## Project board alignment

| Issue | Title | Project status | Roadmap interpretation |
| --- | --- | --- | --- |
| #4 | Set up React Vite Tailwind Redux frontend shell | Done | App shell, Vite/Tailwind/Redux/Router, protected routes, role-based navigation, brand assets, theme toggle, and 15+ route pages. Closed 2026-06-21. |
| #5 | Set up Supabase schema and RLS baseline | Done | Baseline complete and verified by local Supabase RLS tests. |
| #6 | Build auth and role onboarding | Done | Login/signup, email verification, forgot password, persona onboarding, Redux session/profile state, seed users. Closed 2026-06-21. |
| #7 | Create creator profile and social showcase | Done | Profile epic includes social links, manual stats, portfolio media upload, availability/rate card, and public showcase editor. Closed 2026-06-21. |
| #8 | Create business profile and verification workflow | Done | High-priority trust epic; private uploads, admin approval/rejection, and verified-only outreach/publishing must remain enforced by backend policies. Full implementation complete including business profile editor, verification document upload, admin review panel, and discover-page verification display. Closed 2026-06-21. |
| #9 | Build location-based discovery MVP | Backlog | City-level discovery only; public results must use safe views and avoid exact coordinates. |
| #10 | Build appointments MVP | Backlog | Participant-only appointment lifecycle: request, accept/decline, reschedule, cancel, and reminders. |
| #11 | Build realtime messaging MVP | Backlog | MVP scope is text and links only; no message attachments despite older issue wording. Realtime subscriptions must respect RLS. |
| #12 | Build campaigns and x-deals MVP | Backlog | Business-created campaigns only; verified businesses can publish, creators can view/respond to eligible opportunities. |
| #13 | Create monetization plan and subscription gates | Backlog | Keep as post-MVP/beta preparation; implement feature gates without full payment processing. |
| #14 | Create admin moderation and audit logs | Backlog | Verification review, reports, suspicious account workflows, and auditable admin actions. |
| #15 | Security hardening before beta | Backlog | Final pre-beta gate covering RLS/storage audits, dependency audit, secret scanning, rate limits, privacy/compliance review. |
| #16-#21 | Recent review/test/docs follow-ups | Done | Cleanup, error handling, search behavior, typecheck fixes, local dashboard, and Billing test coverage are complete on the board. |

## Near-term execution plan

1. ~~Close or split current in-progress work (#4, #6).~~ **Done 2026-06-21.**
2. ~~Prioritize trust-critical profile work (#8, then #7/#9).~~ **#8 and #7 done 2026-06-21.**
   - Business verification blocks outreach and campaign publishing, so finish this before opening broader collaboration flows.
   - Pair profile/discovery UI with Supabase service tests and RLS/storage review.
3. **Deliver collaboration workflows (#11, #10, #12).**
   - Messaging should stay MVP-simple: text and links only.
   - Appointments and campaigns should preserve participant/eligibility access boundaries.
4. **Finish admin and beta hardening (#14, #15).**
   - Audit admin actions and verification decisions.
   - Run a focused security review before beta.
5. **Keep monetization as gated foundation (#13).**
   - Preserve hooks/feature gates, but defer full billing and subscription processing until after MVP validation.

## Roadmap guardrails

- Do not add service role keys or secrets to the frontend.
- Do not bypass RLS; frontend guards are UX only.
- Business verification remains mandatory before outreach or campaign publishing.
- Discovery exposes city-level/safe public fields only.
- Messaging supports text and links only for MVP.
- Keep changes small, tested, and reviewable.
