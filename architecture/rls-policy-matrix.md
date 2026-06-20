# Collabify RLS and Storage Policy Matrix

## Policy principles

- Enable RLS on every app table.
- Use `auth.uid()` and helper functions for ownership and participant checks.
- Use safe public views for discovery instead of broad table reads.
- Admin access must be server-controlled and audited.
- Frontend route guards are not authorization.

## Table policy matrix

| Table | Read | Insert | Update | Delete | Notes |
| --- | --- | --- | --- | --- | --- |
| `profiles` | self, admin, limited public via view | authenticated self/onboarding | self limited fields, admin sensitive fields | admin only/soft delete | Admin role not frontend assignable |
| `creator_profiles` | owner, admin, public via safe view | creator owner | owner, admin moderation fields | owner/admin per policy | Public view excludes private fields |
| `business_profiles` | owner, admin, public via safe view | business owner | owner limited fields, admin verification fields | owner/admin per policy | Verification status admin-controlled |
| `social_accounts` | owner, admin, safe public fields via view | owner | owner | owner/admin | No OAuth tokens in MVP |
| `stats_snapshots` | owner, admin, safe aggregate via view | owner | owner | owner/admin | Manual stats only |
| `verification_documents` | owner metadata, admin | business owner | admin status/review only | admin/owner limited | Private storage required |
| `campaigns` | public published via view, owner, participants, admin | business owner | owner; publish only if verified | owner/admin | Business-created only |
| `offers` | participants, admin | eligible participant/business workflow | participants by valid status transitions | restricted/admin | Private terms participant-only |
| `appointments` | participants, admin | participants | participants by valid status transitions | restricted/admin | Participant-only details |
| `conversations` | participants, admin | verified business or valid workflow | participants limited metadata | restricted/admin | Access via participant table |
| `conversation_participants` | participants, admin | controlled by conversation creation flow | restricted/admin | restricted/admin | Do not allow arbitrary membership |
| `messages` | conversation participants, admin if required | participant sender only | sender limited edits if allowed | sender/admin per policy | Text and links only; realtime safe |
| `consent_records` | self, admin | self/system | no update preferred | admin only | Append-only preferred |
| `audit_logs` | admin/system only | system/privileged only | no update | no delete except retention process | Protect integrity |
| `reports` | reporter limited, reported user limited if needed, admin | authenticated users | admin/moderation only | admin only | Avoid retaliation/privacy leaks |
| `admin_actions` | admin only | admin/system only | no update preferred | no delete except retention process | Auditable admin trail |
| `plans` | public active plans/admin | admin/system | admin/system | admin/system | Monetization placeholder |
| `subscriptions` | self, admin/system | system only | system only | admin/system | Post-MVP gate support |

## Business verification gates

Database policies and service functions must prevent unverified businesses from:

- initiating outreach conversations
- publishing campaigns
- creating active x-deal opportunities

## Storage policy matrix

| Bucket | Read | Write | Delete | Notes |
| --- | --- | --- | --- | --- |
| `avatars` | public if approved | owner | owner/admin | Validate type and size |
| `portfolio-media` | public or moderated | creator owner | owner/admin | Can be deferred if not required |
| `verification-documents` | owner own docs, admin | business owner | admin/owner restricted | Private bucket, no public URLs |
| `campaign-assets` | public for published campaigns or participants | verified business owner | owner/admin | Policy tied to campaign visibility |
| `message-attachments` | deferred | deferred | deferred | Not part of MVP |

## RLS test scenarios

- Owner can read/update own profile.
- Other user cannot read private profile fields.
- Public views do not expose private fields.
- Unverified business cannot publish campaign.
- Unverified business cannot initiate outreach.
- Verified business can publish own campaign.
- Non-participant cannot read conversation or messages.
- Participant can send message only as self.
- Realtime does not deliver unreadable messages.
- Verification docs are private from non-owner users.
- Admin review action is auditable.
