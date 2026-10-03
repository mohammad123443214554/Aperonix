-- Aperonix AI: cache extracted file text so follow-up messages are fast
-- Run this once in the Supabase SQL Editor.
--
-- Images (OCR/vision), PDFs, DOCX, audio and text files are processed once.
-- The extracted text is stored here and reused for every later message in
-- the chat instead of calling the AI models again.

alter table public.aperonix_files
  add column if not exists extracted_text text null;
