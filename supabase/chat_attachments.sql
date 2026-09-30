-- Aperonix AI: file uploads for chat messages
-- Run this complete script once in the Supabase SQL Editor.

create table if not exists public.chat_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid not null references public.chat_sessions(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists chat_attachments_chat_id_idx
  on public.chat_attachments (chat_id);

create index if not exists chat_attachments_message_id_idx
  on public.chat_attachments (message_id);

create index if not exists chat_attachments_user_id_idx
  on public.chat_attachments (user_id);

alter table public.chat_attachments enable row level security;

grant select, insert, delete on public.chat_attachments to authenticated;

drop policy if exists "Users can view their own chat attachments" on public.chat_attachments;
create policy "Users can view their own chat attachments"
on public.chat_attachments
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own chat attachments" on public.chat_attachments;
create policy "Users can create their own chat attachments"
on public.chat_attachments
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.chat_messages m
    where m.id = chat_attachments.message_id
      and m.chat_id = chat_attachments.chat_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own chat attachments" on public.chat_attachments;
create policy "Users can delete their own chat attachments"
on public.chat_attachments
for delete
using (auth.uid() = user_id);

-- Private bucket: objects are never publicly readable.
insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', false)
on conflict (id) do update
set public = false;

drop policy if exists "Users can upload their own chat files" on storage.objects;
create policy "Users can upload their own chat files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read their own chat files" on storage.objects;
create policy "Users can read their own chat files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own chat files" on storage.objects;
create policy "Users can delete their own chat files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
