-- Aperonix AI: Branch in new chat
-- Run this once in the Supabase SQL Editor.

alter table public.chat_sessions
  add column if not exists branch_from_chat_id uuid references public.chat_sessions(id) on delete set null,
  add column if not exists branch_from_message_id uuid references public.chat_messages(id) on delete set null;

create index if not exists chat_sessions_branch_from_chat_id_idx
  on public.chat_sessions (branch_from_chat_id);

create index if not exists chat_sessions_branch_from_message_id_idx
  on public.chat_sessions (branch_from_message_id);