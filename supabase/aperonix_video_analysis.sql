-- Aperonix AI Step 4: cached Gemini video understanding
-- Run this once in the Supabase SQL Editor.
--
-- The video itself stays in the private aperonix-files bucket.
-- Only Gemini's text understanding is cached here so follow-up questions
-- can reuse the analysis without sending the same video to Gemini again.

alter table public.aperonix_files
  add column if not exists video_analysis text null;

alter table public.aperonix_files
  add column if not exists video_analysis_at timestamptz null;

create index if not exists aperonix_files_video_analysis_idx
  on public.aperonix_files(id)
  where video_analysis is not null;
