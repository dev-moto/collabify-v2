# Collabify Database Design

## Design goals

- Keep authorization enforceable through RLS.
- Separate public-safe views from private raw tables.
- Support business verification before outreach and campaign publishing.
- Support city-based discovery without exposing exact locations.
- Support text/link messaging only for MVP.
- Prepare monetization gates without requiring full billing.

## Core entities

### `profiles`

- One row per Supabase Auth user.
- Stores role, display name, onboarding status, account status, and shared metadata.
- Sensitive contact fields should not be exposed through public views.

### `creator_profiles`

- One row per creator profile.
- Stores bio, categories/niches, city, public profile fields, availability, and profile completeness.

### `business_profiles`

- One row per business profile.
- Stores brand/company details, city, industry, verification status, and safe public fields.

### `social_accounts`

- Creator-owned social links.
- Stores platform, handle, URL, and verification/manual status.
- MVP should avoid storing OAuth tokens.

### `stats_snapshots`

- Manual creator stats snapshots.
- Stores follower count, engagement metrics, views, and capture date.

### `verification_documents`

- Private metadata for submitted business verification documents.
- File objects live in private storage.
- Access limited to owner and admins under policy.

### `campaigns`

- Business-owned campaign or x-deal posts.
- Statuses include draft, published, closed, cancelled.
- Publishing requires verified business status.

### `offers`

- Connects creators and businesses around a campaign or direct collaboration.
- Participant-only access for private terms and status.

### `appointments`

- Participant-scoped scheduling records.
- Supports requested, accepted, declined, rescheduled, cancelled, completed.

### `conversations`

- Conversation shell for messaging.
- Access determined through `conversation_participants`.

### `conversation_participants`

- Join table for conversation membership.
- Used in RLS participant checks.

### `messages`

- Text/link message content only for MVP.
- Sender must be a conversation participant.

### `consent_records`

- Append-only or audit-friendly consent records for terms/privacy/marketing/data processing.

### `audit_logs`

- Records sensitive writes and admin actions.
- Admin/system-readable, not public.

### `reports`

- User reports for abuse, impersonation, spam, fraud, or unsafe behavior.

### `admin_actions`

- Explicit admin moderation and verification actions.

### Monetization placeholders

- `plans`, `subscriptions`, and payment reference tables can exist as placeholders for post-MVP gates.
- Do not store raw payment data.

## Public views

Create safe public views for:

- creator cards
- business cards
- public campaign cards

These views must exclude private contact info, exact coordinates, document metadata, payment identifiers, messages, appointment details, admin notes, and risk data.

## Indexing plan

Add indexes for:

- `user_id` / owner foreign keys
- profile role and status
- verification status
- city
- campaign status
- participant lookup fields
- created/updated timestamps where used in feeds

## Audit requirements

Audit logs should cover:

- verification decisions
- admin role changes
- business verification status changes
- campaign publishing
- sensitive profile changes
- moderation/report decisions
