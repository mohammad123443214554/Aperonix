-- Aperonix AI video frame metadata
-- Run this once in Supabase SQL Editor after aperonix_files.sql.
-- This lets Aperonix store a few small preview frames extracted from
-- uploaded videos so the vision model can inspect the video's visuals.

alter table public.aperonix_files
  add column if not exists parent_file_id uuid null
  references public.aperonix_files(id)
  on delete cascade;

alter table public.aperonix_files
  add column if not exists frame_timestamp_ms bigint null
  check (frame_timestamp_ms is null or frame_timestamp_ms >= 0);

create index if not exists aperonix_files_parent_file_id_idx
  on public.aperonix_files(parent_file_id);

create index if not exists aperonix_files_parent_frame_time_idx
  on public.aperonix_files(parent_file_id, frame_timestamp_ms);
