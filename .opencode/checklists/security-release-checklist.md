# Security Release Checklist

## Supabase
- [ ] RLS enabled on all app tables
- [ ] Storage policies tested
- [ ] No service role key in frontend
- [ ] Admin-only data protected
- [ ] Realtime access tested
- [ ] Audit logs written for sensitive changes

## Frontend
- [ ] No secrets in client code
- [ ] Role guards added
- [ ] Form validation added
- [ ] XSS-safe rendering
- [ ] Error messages do not leak internals

## GitHub
- [ ] Branch protection enabled
- [ ] Required CI checks enabled
- [ ] Dependabot enabled
- [ ] Secret scanning enabled
- [ ] Workflow permissions reviewed
- [ ] Third-party actions pinned before production

## Compliance
- [ ] Privacy notice
- [ ] Terms
- [ ] Consent records
- [ ] Deletion request workflow
- [ ] Breach response plan
- [ ] PH-only layered access controls
