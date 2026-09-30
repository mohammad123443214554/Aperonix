-- Aperonix AI: public sharing for responses and prompts
-- Run this complete script once in the Supabase SQL Editor.

create table if not exists public.shared_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid not null references public.chat_sessions(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  content text not null,
  content_type text not null default 'response',
  created_at timestamptz not null default now(),
  unique (user_id, message_id)
);

-- Add the new column to existing installations before any policy references it.
alter table public.shared_responses
  add column if not exists content_type text not null default 'response';

-- Keep the column limited to the two supported share types.
do $$
begin
  alter table public.shared_responses
    add constraint shared_responses_content_type_check
    check (content_type in ('response', 'prompt'));
exception
  when duplicate_object then null;
end $$;

create index if not exists shared_responses_user_id_idx
  on public.shared_responses (user_id);

create index if not exists shared_responses_message_id_idx
  on public.shared_responses (message_id);

create index if not exists shared_responses_content_type_idx
  on public.shared_responses (content_type);

alter table public.shared_responses enable row level security;

grant select on public.shared_responses to anon, authenticated;
grant insert on public.shared_responses to authenticated;

drop policy if exists "Anyone can view public shared responses" on public.shared_responses;
create policy "Anyone can view public shared responses"
on public.shared_responses
for select
using (true);

drop policy if exists "Users can create shares for their own messages" on public.shared_responses;
drop policy if exists "Users can create shares for their own assistant messages" on public.shared_responses;

create policy "Users can create shares for their own messages"
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
      and m.role in ('assistant', 'user')
      and m.content = shared_responses.content
      and shared_responses.content_type =
        case when m.role = 'user' then 'prompt' else 'response' end
  )
);
