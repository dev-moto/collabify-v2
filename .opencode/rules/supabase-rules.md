# Supabase Rules

- Enable RLS on every app table.
- Use `auth.uid()` in policies.
- Never expose service role key in frontend.
- Use Edge Functions for privileged actions.
- Use storage policies for every bucket.
- Use safe public views for creator/business cards.
- Add indexes for location, role, status, user IDs, and foreign keys.
- Add audit logs for sensitive writes.
- Realtime must only expose rows the user can read.
