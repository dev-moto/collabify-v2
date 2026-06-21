# Collabify Design System

## Design intent

Collabify should feel trustworthy enough for businesses and warm enough for Filipino creators. The interface should be clean, social, professional, and easy for non-technical users to understand.

Core qualities:

- **Trustworthy**: clear verification states, privacy-first language, and calm surfaces.
- **Creator-friendly**: bright accents, rounded cards, and expressive but restrained visuals.
- **Business-ready**: strong hierarchy, concise CTAs, and dashboard patterns that avoid clutter.
- **Mobile-first**: all pages should work comfortably on small screens before expanding to desktop grids.

## Brand mark

The Collabify logo combines:

- a rounded collaboration tile,
- two connected profile nodes,
- a spark/star for creator energy,
- a cyan-to-violet gradient for trust plus creative momentum.

Primary asset:

```text
frontend/public/collabify-logo.svg
```

Use the icon with the wordmark in headers and auth pages. Use the icon alone for compact mobile contexts and favicons.

## Color palette

The palette balances SaaS trust with creator-marketplace energy.

### Primary: Trust Cyan

Use for primary actions, links, focus states, and positive product accents.

| Token | Hex | Use |
| --- | --- | --- |
| `cyan-50` | `#ecfeff` | soft backgrounds |
| `cyan-100` | `#cffafe` | selected light states |
| `cyan-300` | `#67e8f9` | dark-mode text accents |
| `cyan-500` | `#06b6d4` | primary gradient/action |
| `cyan-600` | `#0891b2` | links and active controls |
| `cyan-700` | `#0e7490` | accessible text on light backgrounds |

### Secondary: Creator Violet

Use for creator energy, campaign/x-deal highlights, and secondary gradients.

| Token | Hex | Use |
| --- | --- | --- |
| `violet-50` | `#f5f3ff` | soft backgrounds |
| `violet-200` | `#ddd6fe` | borders and subtle emphasis |
| `violet-500` | `#8b5cf6` | gradient/action accent |
| `violet-600` | `#7c3aed` | strong brand accent |
| `violet-700` | `#6d28d9` | accessible light-mode text |

### Accent: Verified Emerald

Use only for verification, success, and approved states.

| Token | Hex | Use |
| --- | --- | --- |
| `emerald-50` | `#ecfdf5` | success background |
| `emerald-300` | `#6ee7b7` | dark-mode success text |
| `emerald-500` | `#10b981` | icons and badges |
| `emerald-700` | `#047857` | accessible success text |

### Warning: Campaign Amber

Use for pending verification, pending appointments, and attention states.

| Token | Hex | Use |
| --- | --- | --- |
| `amber-50` | `#fffbeb` | warning background |
| `amber-300` | `#fcd34d` | dark-mode warning text |
| `amber-500` | `#f59e0b` | warning icons |
| `amber-700` | `#b45309` | accessible warning text |

### Danger: Moderation Red

Use for destructive actions, reports, and errors.

| Token | Hex | Use |
| --- | --- | --- |
| `red-50` | `#fef2f2` | error background |
| `red-500` | `#ef4444` | error icons |
| `red-600` | `#dc2626` | form validation text |
| `red-700` | `#b91c1c` | accessible danger text |

### Neutrals: Slate

Use slate for text, surfaces, borders, and dark mode.

| Token | Hex | Use |
| --- | --- | --- |
| `slate-50` | `#f8fafc` | app background |
| `slate-100` | `#f1f5f9` | subtle fills |
| `slate-200` | `#e2e8f0` | borders |
| `slate-500` | `#64748b` | muted text |
| `slate-600` | `#475569` | body text |
| `slate-800` | `#1e293b` | strong surfaces |
| `slate-950` | `#020617` | primary text / dark background |

## Gradients

Primary brand gradient:

```text
from-cyan-500 to-violet-600
```

Use it for hero CTAs, the logo tile, and selected high-impact cards only. Do not overuse gradients inside data-heavy dashboards.

## Typography

- Font: `Inter`, then system sans-serif fallback.
- Page titles: `font-black tracking-tight`, 32–72px depending on viewport.
- Section titles: `font-black`, 24–40px.
- Body copy: `text-slate-600` on light mode and `dark:text-slate-300` on dark mode.
- Labels and small UI text: `text-sm font-semibold`.

Avoid long paragraphs in dashboards. Use short descriptions and cards.

## Spacing and shape

- Page padding: `px-4` mobile, `px-6`/`lg:px-8` desktop.
- Max content width: `max-w-7xl` for app and marketing pages.
- Card radius: `rounded-3xl`.
- Hero/feature containers: `rounded-[2rem]`.
- Buttons and inputs: `rounded-full` or `rounded-2xl` for form fields.
- Default card padding: `p-5` or `p-6`.

## Elevation

- Default cards: `shadow-sm`.
- Hero/marketing cards: `shadow-xl` or `shadow-2xl` with low-opacity colored shadow.
- Avoid heavy shadows in dashboards.

## Components

### Buttons

- Primary: dark slate or brand gradient for highest-priority action.
- Secondary: white/transparent card-like button.
- Ghost: low-emphasis navigation/action.
- All buttons need visible focus rings: `focus:ring-2 focus:ring-cyan-400`.

### Cards

Cards should group one clear concept. Avoid mixing unrelated metrics, forms, and navigation in one card.

### Badges

Use badges for status and role cues:

- `green`: verified, approved, success
- `amber`: pending, needs review
- `red`: rejected, blocked, report
- `cyan`: participant-only, safe public fields, active workspace
- `violet`: campaigns, offers, creator/category highlights
- `slate`: neutral metadata

### Forms

- Every input must have a visible label.
- Show validation messages near the field.
- Disable submit buttons while loading.
- Use `role="alert"` for errors and `role="status"` for non-error status messages.

### Persona selection

Registration and onboarding should use persona-first cards when users need to choose between creator and business flows.

- Use two clear cards: **Creator** and **Business**.
- Each card should include one icon, a short title, one concise description, and 2–3 benefits.
- The selected card uses cyan/violet brand treatment plus a check icon.
- Keep persona copy practical and non-technical.
- Persona selection is UX guidance only; persisted role/profile data must still be enforced by Supabase RLS.

### Empty/loading/error states

Every data-dependent screen should include:

- loading state,
- empty state,
- error state,
- success/confirmation state where relevant.

Use friendly, non-technical copy.

## Layout patterns

### Public marketing

- Sticky translucent header.
- Strong hero with one primary CTA and one secondary CTA.
- Feature cards in responsive grids.
- Trust/security section with clear privacy language.

### App workspace

- Role-based shell: creator, business, admin.
- Sticky top nav on desktop; mobile-friendly navigation should be added before beta.
- Dashboard cards should highlight next action, not just metrics.

### Discovery cards

Public cards must only show safe fields:

- display name or business name,
- city-level location,
- niches/industry,
- public-safe stats,
- verification badge where appropriate.

Never show exact coordinates, private contact info, verification document metadata, admin notes, or private deal terms in public cards.

## Accessibility

- Use semantic headings in order.
- Icon-only buttons require `aria-label`.
- Preserve keyboard focus states.
- Keep color contrast accessible; do not rely on color alone for status.
- Inputs require labels and helpful errors.

## Security and privacy UI rules

- Frontend role checks are UX only; Supabase RLS is the source of truth.
- Never expose service role keys or private RLS-protected data.
- Use privacy copy such as “Public fields only” and “Participant-only” where it helps users understand boundaries.
- Messaging MVP supports text and links only; attachment UI must remain disabled or clearly policy-gated until storage rules are implemented.
