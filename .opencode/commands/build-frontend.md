---

description: Build Collabify React frontend with modern, user-friendly UI
agent: frontend
---------------

Build the Collabify web frontend using React JS, Vite, TailwindCSS, lucide-react, react-redux / Redux Toolkit, React Router, and Supabase client.

Create a modern, clean, responsive, and user-friendly interface that fits Collabify’s purpose: connecting Filipino content creators/vloggers with brands and businesses for collaborations, x-deals, paid campaigns, appointments, and messaging.

Design direction:

* Use a professional creator-marketplace style.
* Make the UI feel modern, trustworthy, social, and business-ready.
* Prioritize mobile-first responsive layouts even though this is the web app.
* Use clear visual hierarchy, generous spacing, rounded cards, clean typography, and intuitive navigation.
* Use lucide-react icons consistently.
* Use TailwindCSS utility classes with reusable components.
* Avoid cluttered dashboards and overly technical screens.
* Make every screen easy for non-technical creators and business owners to understand.

Core UI requirements:

* Landing page with clear value proposition for creators and businesses.
* Auth pages for login, registration, email verification, forgot password, and role selection.
* Creator dashboard with profile completion, social stats, appointments, campaigns, and messages.
* Business dashboard with creator discovery, active campaigns, appointments, and verification status.
* Creator profile showcase page with social stats, portfolio, niches, location area, availability, and collaboration preferences.
* Business profile page with brand details, verification badge, campaign interests, and contact options.
* Discovery pages for creators and businesses with filters, cards, search, empty states, and loading states.
* Appointment pages with calendar-friendly layout, status badges, request forms, and meeting details.
* Messaging UI with conversation list, chat thread, message composer, attachment-ready layout, and realtime-ready structure.
* Campaign/x-deal pages with offer status, deliverables, budget/x-deal details, notes, and progress.
* Settings and billing pages.
* Admin-ready pages for verification review, reports, audit logs, and user moderation.

UX requirements:

* Every page must have loading, empty, success, and error states.
* Every form must include validation and helpful error messages.
* Use clear call-to-action buttons.
* Use role-based navigation for creator, business, and admin users.
* Use protected routes and redirect unauthenticated users properly.
* Do not expose private data in the UI unless Supabase RLS allows it.
* Public discovery cards must show only safe public fields.
* Exact user coordinates must not be displayed publicly.
* Make the UI accessible with semantic HTML, labels, keyboard-friendly controls, focus states, and aria labels for icon-only buttons.

Frontend architecture:

* Keep pages thin.
* Use reusable components.
* Put Supabase queries in service modules or hooks, not directly inside large UI components.
* Use Redux Toolkit only for global state such as auth, profile, role, UI state, notifications, and selected filters.
* Use local state for purely local component interactions.
* Organize features by domain: auth, onboarding, creator-profile, business-profile, discovery, appointments, messaging, campaigns, monetization, admin, and compliance.

Security requirements:

* Never add secrets to the frontend.
* Never use Supabase service role key.
* Only use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the frontend.
* Do not rely on frontend-only role checks for real authorization.
* Assume Supabase RLS is the source of truth.
* Validate user inputs before sending to Supabase.
* Handle file upload UI safely and prepare for storage policy restrictions.

Build the frontend in small, reviewable steps. After major screens are created, run lint/build/tests when available and prepare the output for `/code-review`.
