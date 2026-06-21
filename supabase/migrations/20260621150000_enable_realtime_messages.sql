-- Enable Realtime for the messages table so the frontend can
-- subscribe to new messages without polling.

-- Drop from the default publication first to avoid duplicate errors
do $$
begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
    alter publication supabase_realtime drop table public.messages;
  end if;
end;
$$;

alter publication supabase_realtime add table public.messages;
