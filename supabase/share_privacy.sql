-- Aperonix AI: stop shared chats/responses from being listable by everyone
-- Run this complete script once in the Supabase SQL Editor.
--
-- Before: anyone holding the public anon key could list EVERY shared chat and
-- response through the REST API. After: a share is only readable by someone
-- who knows its link (id), and owners can still read their own rows.

-- 1) Public link lookups go through these two functions (id required).
create or replace function public.get_shared_response(share_id uuid)
returns table (
  id uuid,
  content text,
  content_type text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.content, r.content_type, r.created_at
  from public.shared_responses r
  where r.id = share_id;
$$;

create or replace function public.get_shared_chat(share_id uuid)
returns table (
  id uuid,
  title text,
  messages jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.title, c.messages, c.created_at, c.updated_at
  from public.shared_chats c
  where c.id = share_id;
$$;

revoke all on function public.get_shared_response(uuid) from public;
revoke all on function public.get_shared_chat(uuid) from public;
grant execute on function public.get_shared_response(uuid) to anon, authenticated;
grant execute on function public.get_shared_chat(uuid) to anon, authenticated;

-- 2) Tables: owners only (no more "anyone can list everything").
drop policy if exists "Anyone can view public shared chats" on public.shared_chats;
drop policy if exists "Owners can view their shared chats" on public.shared_chats;
create policy "Owners can view their shared chats"
  on public.shared_chats
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Anyone can view public shared responses" on public.shared_responses;
drop policy if exists "Owners can view their shared responses" on public.shared_responses;
create policy "Owners can view their shared responses"
  on public.shared_responses
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke select on public.shared_chats from anon;
revoke select on public.shared_responses from anon;
