-- Run once in the Supabase SQL Editor for an existing database. Safe to rerun.
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS services jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS testimonials jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE public.portfolio_settings SET
  sections_order = CASE WHEN sections_order ? 'services' THEN sections_order ELSE sections_order || '"services"'::jsonb END,
  sections_visible = sections_visible || '{"services":true}'::jsonb;
UPDATE public.portfolio_settings SET
  sections_order = CASE WHEN sections_order ? 'testimonials' THEN sections_order ELSE sections_order || '"testimonials"'::jsonb END,
  sections_visible = sections_visible || '{"testimonials":true}'::jsonb;
