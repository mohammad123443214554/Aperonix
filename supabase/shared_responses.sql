-- Aperonix AI: public response sharing
-- Run this once in the Supabase SQL Editor.

create table if not exists public.shared_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid not null references public.chat_sessions(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, message_id)
);

create index if not exists shared_responses_user_id_idx
  on public.shared_responses (user_id);

create index if not exists shared_responses_message_id_idx
  on public.shared_responses (message_id);

alter table public.shared_responses enable row level security;

grant select on public.shared_responses to anon, authenticated;
grant insert on public.shared_responses to authenticated;

drop policy if exists "Anyone can view public shared responses" on public.shared_responses;
create policy "Anyone can view public shared responses"
on public.shared_responses
for select
using (true);

drop policy if exists "Users can create shares for their own assistant messages" on public.shared_responses;
create policy "Users can create shares for their own assistant messages"
on public.shared_responses
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.chat_messages m
    where m.id = shared_responses.message_id
      and m.chat_id = shared_responses.chat_id
      and m.user_id = auth.uid()
      and m.role = 'assistant'
      and m.content = shared_responses.content
  )
);
