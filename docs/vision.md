# Collabify Vision

## Product vision

Collabify is a Philippines-first collaboration marketplace that connects content creators and businesses for trusted campaigns, x-deals, appointments, and messaging.

The MVP should help businesses discover creators by city, verify business legitimacy before outreach, and keep sensitive collaboration data protected by Supabase RLS and storage policies.

## Target market

- Philippines-based creators and vloggers
- Local businesses, SMEs, brands, and agencies
- Admin reviewers responsible for verification, moderation, and compliance operations

## Product principles

1. **Trust before scale**: business verification is mandatory before outreach or campaign publishing.
2. **Privacy by default**: public discovery uses city-level and safe public fields only.
3. **Backend-enforced authorization**: frontend guards are UX only; Supabase RLS and storage policies enforce access.
4. **Simple MVP workflows**: messaging supports text and links only; monetization is prepared through gates, not full billing.
5. **PH-only as layered risk control**: use layered signals and do not promise perfect VPN blocking.

## MVP outcomes

- Creators can onboard and publish safe public profiles.
- Businesses can onboard, submit verification, and publish campaigns only after approval.
- Users can discover public profiles by city.
- Participants can message with text and links only.
- Participants can request and manage appointments.
- Admins can review verification and moderation workflows with audit logs.

## Deferred outcomes

- Full subscription billing and payments
- File/image message attachments
- Creator-created campaign postings
- Exact-location public discovery
- Audio/video calling
- Native mobile apps
- Automated social platform integrations
