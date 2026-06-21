-- Security-definer function to resolve participant display names
-- for messaging. Bypasses profiles RLS (which restricts SELECT to
-- self or admin) while exposing only id and display_name.
-- Callers must already have participant_ids from
-- conversation_participants (RLS-protected), so the user_ids
-- are pre-vetted. This function simply resolves names.

create or replace function public.get_participant_profiles(user_ids uuid[])
returns table (
  user_id uuid,
  display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select id, display_name
  from public.profiles
  where id = any(user_ids);
$$;

grant execute on function public.get_participant_profiles to authenticated;
