-- Run once in the Supabase SQL Editor for an existing database.
-- Safe to run more than once.
ALTER TABLE public.portfolio_settings
  ADD COLUMN IF NOT EXISTS show_light_mode_bugs boolean NOT NULL DEFAULT false;
