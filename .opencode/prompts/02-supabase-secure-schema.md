# Secure Supabase Schema Prompt

Generate:
- PostgreSQL tables
- enums
- constraints
- indexes
- updated_at triggers
- RLS policies
- storage policies
- seed data
- audit log triggers
- consent records
- safe public views

Security requirements:
- RLS on all app tables
- private documents admin-only
- messages participant-only
- appointments participant-only
- campaigns participant-only unless public campaign listing
- admin actions logged
