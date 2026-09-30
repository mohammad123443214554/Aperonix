-- Aperonix AI: public sharing for complete chat conversations
-- Run this complete script once in the Supabase SQL Editor.

create table if not exists public.shared_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid not null references public.chat_sessions(id) on delete cascade,
  title text not null default 'Shared chat',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, chat_id)
);

create index if not exists shared_chats_user_id_idx
  on public.shared_chats (user_id);

create index if not exists shared_chats_chat_id_idx
  on public.shared_chats (chat_id);

alter table public.shared_chats enable row level security;

grant select on public.shared_chats to anon, authenticated;
grant insert, update on public.shared_chats to authenticated;

drop policy if exists "Anyone can view public shared chats" on public.shared_chats;
create policy "Anyone can view public shared chats"
on public.shared_chats
for select
using (true);

drop policy if exists "Users can create shares for their own chats" on public.shared_chats;
create policy "Users can create shares for their own chats"
on public.shared_chats
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.chat_sessions c
    where c.id = shared_chats.chat_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can update shares for their own chats" on public.shared_chats;
create policy "Users can update shares for their own chats"
on public.shared_chats
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
