-- Aperonix per-user personalization setting
-- Run this once in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists aperonix_setting text;
