-- Run once in the Supabase SQL Editor for an existing database.
ALTER TABLE public.portfolio_settings
  ADD COLUMN IF NOT EXISTS work_experience jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add Experience to existing layouts without replacing the owner's ordering.
UPDATE public.portfolio_settings
SET
  sections_order = CASE
    WHEN sections_order ? 'experience' THEN sections_order
    ELSE sections_order || '"experience"'::jsonb
  END,
  sections_visible = CASE
    WHEN sections_visible ? 'experience' THEN sections_visible
    ELSE sections_visible || '{"experience": true}'::jsonb
  END
WHERE id = 1;
