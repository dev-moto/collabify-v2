# Collabify Roadmap

Last updated: 2026-06-21  
Source of truth: [GitHub Project: Collabify](https://github.com/users/dev-moto/projects/1) and MVP planning docs.

## Snapshot

Collabify is in active MVP implementation. The Supabase schema/RLS baseline, frontend shell/auth, profiles, discovery, appointments, messaging, campaigns, and monetization-gate foundation are complete on the GitHub Project. Admin moderation/audit is now the active MVP focus, with security hardening still reserved as the pre-beta gate.

| Phase | Project items | Status | Outcome |
| --- | --- | --- | --- |
| 0. Planning and security baseline | #5, docs/architecture/security planning | Done | Approved product/security foundation, database design, RLS matrix, migrations, storage policies, and passing RLS baseline tests. |
| 1. Frontend shell and onboarding | #4, #6 | Done | React/Vite/Tailwind app shell, Supabase client, Redux session state, protected routes, auth screens, onboarding, role-aware navigation, persona seed users. |
| 2. Profiles, verification, and discovery | #7, #8, #9 | Done | Creator/business profiles, mandatory business verification, private verification files, admin review, safe city-based discovery. |
| 3. Collaboration workflows | #10, #11, #12 | Done | Participant-only messaging, appointments, business-created campaigns, x-deals, and offer workflows. |
| 4. Admin, monetization gates, and beta hardening | #13, #14, #15 | Mixed | #13 is Done, #14 is In progress, and #15 remains Backlog as the final beta hardening gate. |

## Project board alignment

| Issue | Title | Project status | Roadmap interpretation |
| --- | --- | --- | --- |
| #4 | Set up React Vite Tailwind Redux frontend shell | Done | App shell, Vite/Tailwind/Redux/Router, protected routes, role-based navigation, brand assets, theme toggle, and 15+ route pages. Closed 2026-06-21. |
| #5 | Set up Supabase schema and RLS baseline | Done | Baseline complete and verified by local Supabase RLS tests. |
| #6 | Build auth and role onboarding | Done | Login/signup, email verification, forgot password, persona onboarding, Redux session/profile state, seed users. Closed 2026-06-21. |
| #7 | Create creator profile and social showcase | Done | Profile epic includes social links, manual stats, portfolio media upload, availability/rate card, and public showcase editor. Closed 2026-06-21. |
| #8 | Create business profile and verification workflow | Done | High-priority trust epic; private uploads, admin approval/rejection, and verified-only outreach/publishing must remain enforced by backend policies. Full implementation complete including business profile editor, verification document upload, admin review panel, and discover-page verification display. Closed 2026-06-21. |
| #9 | Build location-based discovery MVP | Done | City-level discovery only; public results must use safe views and avoid exact coordinates. Both creator and business discovery pages have city filters, search, and safe public views. Closed 2026-06-21. |
| #10 | Build appointments MVP | Done | Participant-only appointment lifecycle: request, accept/decline, reschedule, cancel, and reminders. Full lifecycle UI with action buttons, counterpart names, inline reschedule. Closed 2026-06-21. |
| #11 | Build realtime messaging MVP | Done | MVP scope is text and links only; no message attachments despite older issue wording. Realtime subscriptions must respect RLS. Full implementation with realtime subscriptions, conversation management, participant profiles, and clickable links. Closed 2026-06-21. |
| #12 | Build campaigns and x-deals MVP | Done | Business-created campaigns only; verified businesses can publish, creators can view/respond to eligible opportunities. Full lifecycle with publish/close, offer send/accept/decline/complete/cancel, and private terms. Closed 2026-06-21. |
| #13 | Create monetization plan and subscription gates | Done | Monetization-gate foundation is complete on the project board; full payment/subscription processing remains deferred beyond MVP validation. |
| #14 | Create admin moderation and audit logs | In progress | Assigned to `dev-moto`; project fields: P1, M, estimate 3, start 2026-06-21, target 2026-06-22. Admin dashboard/service implementation is active, with test cleanup tracked separately in #34. |
| #15 | Security hardening before beta | Backlog | Final pre-beta gate covering RLS/storage audits, dependency audit, secret scanning, rate limits, privacy/compliance review. |
| #16-#21 | Recent review/test/docs follow-ups | Done | Cleanup, error handling, search behavior, typecheck fixes, local dashboard, and Billing test coverage are complete on the board. |
| #27 | Gate role-specific protected routes by account role | Done | Closed after targeted `ProtectedRoute` verification; deeper no-prefetch/effect timing remains tracked in #29. |
| #34 | Fix admin route tests after admin dashboard navigation refactor | Ready | Created from targeted validation failures in `frontend/app/routes/__tests__/admin.test.tsx`; P1, S, estimate 2, assigned to `dev-moto`. |

## Near-term execution plan

1. ~~Close or split current in-progress work (#4, #6).~~ **Done 2026-06-21.**
2. ~~Prioritize trust-critical profile work (#8, then #7/#9).~~ **All three done 2026-06-21.**
   - Business verification blocks outreach and campaign publishing, so finish this before opening broader collaboration flows.
   - Pair profile/discovery UI with Supabase service tests and RLS/storage review.
3. ~~Deliver collaboration workflows (#11, #10, #12).~~ **All three done 2026-06-21.**
4. **Finish admin moderation/audit (#14) and unblock test cleanup (#34).**
   - Audit admin actions and verification decisions.
   - Fix the admin route tests created by the dashboard/navigation refactor.
   - Re-run targeted frontend validation before moving #14 to In review/Done.
5. **Run beta hardening (#15) after admin validation.**
   - Run focused RLS/storage, dependency, secret-scanning, rate-limit, and privacy reviews before beta.

## Latest Project status update

As of 2026-06-21, the Collabify Project board reflects:

- **Done:** core MVP delivery #4-#13 plus completed review/docs/dashboard follow-ups, including #27.
- **In progress:** #14 Admin moderation and audit logs.
- **Ready:** #34 Admin route test cleanup after the admin dashboard/navigation refactor.
- **Backlog:** #15 Security hardening before beta.
- **In review / active validation:** role-effect and dashboard workflow follow-ups remain separate from the core MVP epics and should be verified before closure.

## Roadmap guardrails

- Do not add service role keys or secrets to the frontend.
- Do not bypass RLS; frontend guards are UX only.
- Business verification remains mandatory before outreach or campaign publishing.
- Discovery exposes city-level/safe public fields only.
- Messaging supports text and links only for MVP.
- Keep changes small, tested, and reviewable.
