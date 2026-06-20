# Collabify Product Requirements Document

## Status

- Version: MVP planning draft
- Market: Philippines
- Platform: Web first
- Implementation gate: Do not implement feature code until this PRD, threat model, database design, RLS matrix, and GitHub issues are approved.

## Summary

Collabify connects Philippines-based creators and businesses for trusted collaborations. The MVP focuses on onboarding, verified business outreach, city-based discovery, text/link messaging, appointments, and business-created campaigns/x-deals.

## Locked MVP decisions

- Messaging supports **text and links only**.
- Discovery defaults to **city-level** public location.
- Campaigns are **business-created only**.
- Monetization is **post-MVP/beta**, with feature-gate hooks only.
- Business verification is **mandatory** before outreach or campaign publishing.

## Users

### Creators

- Build a public-safe profile.
- Add social links and manual social stats.
- Discover eligible opportunities.
- Respond to verified businesses.
- Manage messages and appointments with participants only.

### Businesses

- Create a business profile.
- Submit verification documents.
- Discover creators by city.
- After verification, initiate outreach and publish campaigns/x-deals.

### Admins

- Review verification submissions.
- Moderate reports and suspicious activity.
- Review audit logs for sensitive actions.

## MVP features

1. Authentication and creator/business onboarding
2. Creator profiles
3. Business profiles
4. Business verification workflow
5. Manual social stats
6. City-based discovery
7. Realtime messaging with text and links only
8. Appointments
9. Business-created campaigns and x-deals
10. Consent records and audit logs
11. Admin moderation baseline
12. PH-only layered access controls
13. Monetization gate foundations

## Non-goals

- Full billing or subscription payments
- Creator-created campaign postings
- Messaging attachments, images, or files
- Public exact coordinates
- Audio/video calls
- Mobile apps
- Perfect VPN blocking guarantees
- Fully automated social account integrations

## Functional requirements

### Auth and onboarding

- Users can sign up, log in, and log out.
- Users select creator or business role during onboarding.
- Protected routes exist for authenticated areas.
- Role and admin authorization must not depend on frontend-only checks.

### Creator profiles

- Creators can create and edit profile information.
- Creators can add social links and manual stats.
- Public profile cards expose safe fields only.

### Business profiles and verification

- Businesses can create and edit profile information.
- Businesses can submit verification documents.
- Verification files are private.
- Admins can approve or reject verification.
- Unverified businesses cannot initiate outreach or publish campaigns.

### Discovery

- Discovery defaults to city-level filtering.
- Public results use safe public views.
- Exact location data is never public.

### Messaging

- Participants can exchange text and links.
- No attachments are supported in MVP.
- Only conversation participants can read or send messages.
- Realtime subscriptions must respect RLS.

### Appointments

- Participants can request, accept, decline, reschedule, and cancel appointments.
- Appointment details are participant-only.

### Campaigns and x-deals

- Businesses can create campaigns.
- Only verified businesses can publish campaigns.
- Campaign lifecycle includes draft, published, and closed states.
- Creators can view eligible campaigns and respond to offers.

### Compliance and audit

- Consent acceptance is recorded.
- Sensitive changes write audit logs.
- Admin actions are auditable.
- PH-only access uses layered controls and careful product language.

## Success metrics

- Creator onboarding completion rate
- Business verification completion and approval rates
- Verified business outreach rate
- Conversation creation rate
- Appointment request and acceptance rates
- Campaign publish rate
- Unauthorized access/RLS regression count remains zero before beta

## Milestones

1. Planning gate approval — complete
2. Supabase schema/RLS baseline — complete; automated RLS tests passing
3. Frontend shell and auth onboarding — in progress; shell, landing page, auth routes, and mocked role workspaces added
4. Business verification and admin audit baseline
5. Profiles and discovery
6. Messaging, appointments, campaigns
7. Compliance controls and beta hardening
