-- Aperonix AI file storage
-- Step 3: private Storage bucket + file metadata + RLS policies.
--
-- Run this entire file once in the Supabase SQL Editor.
-- Do not create the bucket manually if you run this SQL.

create table if not exists public.aperonix_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid not null references public.chat_sessions(id) on delete cascade,
  message_id uuid null references public.chat_messages(id) on delete set null,
  original_name text not null,
  storage_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null check (size_bytes > 0),
  status text not null default 'uploaded' check (status in ('uploaded', 'ready', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists aperonix_files_user_id_idx
  on public.aperonix_files(user_id);

create index if not exists aperonix_files_chat_id_idx
  on public.aperonix_files(chat_id);

create index if not exists aperonix_files_message_id_idx
  on public.aperonix_files(message_id);

alter table public.aperonix_files enable row level security;

grant select, insert, update, delete
  on table public.aperonix_files
  to authenticated;

drop policy if exists "Aperonix files are viewable by their owner" on public.aperonix_files;
create policy "Aperonix files are viewable by their owner"
  on public.aperonix_files
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Aperonix files can be created by their owner" on public.aperonix_files;
create policy "Aperonix files can be created by their owner"
  on public.aperonix_files
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = aperonix_files.chat_id
        and chat_sessions.user_id = (select auth.uid())
    )
  );

drop policy if exists "Aperonix files can be updated by their owner" on public.aperonix_files;
create policy "Aperonix files can be updated by their owner"
  on public.aperonix_files
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Aperonix files can be deleted by their owner" on public.aperonix_files;
create policy "Aperonix files can be deleted by their owner"
  on public.aperonix_files
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Private bucket. Files are never public just because their URL is known.
insert into storage.buckets (id, name, public, file_size_limit)
values ('aperonix-files', 'aperonix-files', false, 52428800)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "Aperonix users can upload their own files" on storage.objects;
create policy "Aperonix users can upload their own files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'aperonix-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Aperonix users can view their own files" on storage.objects;
create policy "Aperonix users can view their own files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'aperonix-files'
    and owner_id = (select auth.uid()::text)
  );

drop policy if exists "Aperonix users can delete their own files" on storage.objects;
create policy "Aperonix users can delete their own files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'aperonix-files'
    and owner_id = (select auth.uid()::text)
  );
