# GitHub Automation

Target repo:

```text
dev-moto/collabify-v2
```

Seed tickets and branches:

```bash
bash scripts/github/bootstrap-collabify.sh dev-moto/collabify-v2 true
```

## Recommended issue sequence

1. Finalize PRD, threat model, schema plan, and RLS matrix — complete locally
2. Set up React Vite Tailwind Redux frontend shell — in progress locally; shell and major route surfaces added
3. Set up Supabase schema and RLS baseline — complete locally; RLS baseline tests passing
4. Build auth and role onboarding — in progress locally; auth UI/service foundation added
5. Create business profile and verification workflow
6. Create admin moderation and audit logs foundation
7. Create creator profile and social showcase
8. Build city-based discovery MVP
9. Build realtime messaging MVP with text and links only
10. Build appointments MVP
11. Build campaigns and x-deals MVP
12. Implement consent records and privacy controls
13. Implement PH-only layered access controls
14. Create monetization gates foundation for post-MVP/beta
15. Security hardening before beta

## Dependency rules

- Do not start feature implementation before the planning gate is approved.
- Do not enable public discovery before safe public views exist.
- Do not enable messaging realtime before participant RLS is tested.
- Do not allow campaign publishing or outreach before business verification is enforced.
- Do not begin beta before RLS, storage, public views, secrets, and privacy controls are reviewed.

## Locked MVP decisions

- Messaging supports text and links only.
- Discovery defaults to city-level public location.
- Campaigns are business-created only.
- Monetization is post-MVP/beta with gate hooks only.
- Business verification is mandatory before outreach or campaign publishing.
