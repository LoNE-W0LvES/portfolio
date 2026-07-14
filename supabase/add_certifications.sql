-- Run once in the Supabase SQL Editor for an existing database. Safe to rerun.
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS certifications jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE public.portfolio_settings SET
  sections_order = CASE WHEN sections_order ? 'certifications' THEN sections_order ELSE sections_order || '"certifications"'::jsonb END,
  sections_visible = sections_visible || '{"certifications":true}'::jsonb;
