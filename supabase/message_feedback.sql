-- Aperonix AI: response feedback table
-- Run this once in the Supabase SQL Editor.

create table if not exists public.message_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  chat_id uuid not null references public.chat_sessions(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  feedback text not null check (feedback in ('good', 'bad')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, message_id)
);

create index if not exists message_feedback_user_id_idx
  on public.message_feedback (user_id);

create index if not exists message_feedback_message_id_idx
  on public.message_feedback (message_id);

alter table public.message_feedback enable row level security;

drop policy if exists "Users can view their own feedback" on public.message_feedback;
create policy "Users can view their own feedback"
on public.message_feedback
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own feedback" on public.message_feedback;
create policy "Users can create their own feedback"
on public.message_feedback
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.chat_messages m
    where m.id = message_feedback.message_id
      and m.chat_id = message_feedback.chat_id
      and m.user_id = auth.uid()
      and m.role = 'assistant'
  )
);

drop policy if exists "Users can update their own feedback" on public.message_feedback;
create policy "Users can update their own feedback"
on public.message_feedback
for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.chat_messages m
    where m.id = message_feedback.message_id
      and m.chat_id = message_feedback.chat_id
      and m.user_id = auth.uid()
      and m.role = 'assistant'
  )
);

drop policy if exists "Users can delete their own feedback" on public.message_feedback;
create policy "Users can delete their own feedback"
on public.message_feedback
for delete
using (auth.uid() = user_id);

-- Keep updated_at current on changes.
create or replace function public.set_message_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_message_feedback_updated_at on public.message_feedback;
create trigger set_message_feedback_updated_at
before update on public.message_feedback
for each row
execute function public.set_message_feedback_updated_at();
