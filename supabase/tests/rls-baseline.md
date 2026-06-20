# RLS Baseline Test Checklist

This checklist defines the minimum security scenarios to automate before frontend integration.

## Test identities

- Creator A
- Creator B
- Unverified Business A
- Verified Business B
- Admin

## Required scenarios

### Profiles and public views

- [ ] A user can read and update their own profile.
- [ ] A user cannot read another user's private profile row directly.
- [ ] Public creator cards expose only safe fields.
- [ ] Public business cards expose only safe fields.
- [ ] Exact coordinates, private contact info, verification files, and admin notes are not exposed through public views.

### Business verification

- [ ] Unverified Business A cannot publish a campaign.
- [ ] Verified Business B can publish its own campaign.
- [ ] Creator A cannot change a business verification status.
- [ ] Only Admin can update verification document review fields.
- [ ] Verification document storage objects are not readable by unrelated users.

### Messaging

- [ ] Conversation participants can read their conversation.
- [ ] Non-participants cannot read the conversation.
- [ ] A user cannot add themselves to an unrelated conversation by guessing its ID.
- [ ] Participants can insert messages only as themselves.
- [ ] Non-participants cannot insert messages.
- [ ] Message bodies support text and links only; no attachment bucket is required for MVP.

### Appointments and offers

- [ ] Appointment participants can read appointment details.
- [ ] Non-participants cannot read appointment details.
- [ ] Offer participants can read private offer terms.
- [ ] Non-participants cannot read private offer terms.

### Admin and audit

- [ ] Non-admin users cannot read audit logs.
- [ ] Admin users can read audit logs.
- [ ] Admin actions are not visible to non-admin users.

## Automation target

Prefer SQL-based RLS tests run against local Supabase with seeded users before any feature uses these tables in React.

## Automated baseline

The first automated baseline lives in `supabase/tests/rls_baseline.sql` and is intended to run with:

```bash
npx supabase test db
```

It seeds disposable local users inside a rolled-back transaction and checks profile privacy, safe public views, business verification gates, participant-only conversations/messages/appointments/offers, verification document metadata privacy, and admin-only audit/admin action access.

## Latest local result

The automated baseline was repaired and verified after adding required table/view grants for authenticated users.

```text
Files=1, Tests=23
Result: PASS
```

Use this command after migrations are applied or after `npx supabase db reset`:

```bash
npx supabase test db --debug
```
