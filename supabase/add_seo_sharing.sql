-- Run once in the Supabase SQL Editor for an existing database.
-- Safe to run more than once.
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT '';
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT '';
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS social_image_url text NOT NULL DEFAULT '';
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS favicon_url text NOT NULL DEFAULT '';
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS search_indexable boolean NOT NULL DEFAULT true;
