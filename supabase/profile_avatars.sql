-- Aperonix profile photos: metadata + storage bucket
-- Run this once in Supabase SQL Editor.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists avatar_path text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Users can view avatar files" on storage.objects;
create policy "Users can view avatar files"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their avatar files" on storage.objects;
create policy "Users can upload their avatar files"
on storage.objects
for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their avatar files" on storage.objects;
create policy "Users can update their avatar files"
on storage.objects
for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their avatar files" on storage.objects;
create policy "Users can delete their avatar files"
on storage.objects
for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
