-- Dummy template: seed portfolio profile/settings data
-- Run after 01_schema.sql (and usually after 02_add_user.sql)
-- Replace values before use.

UPDATE portfolio_settings SET
  github_username = 'user',
  display_name = 'user',
  title = 'Your title here',
  bio = 'Write your short bio here.',
  about_text = 'Write your about section here.',
  avatar_url = '',
  email = 'contact@example.com',
  location = '',
  website_url = '',
  linkedin_url = '',
  twitter_url = '',
  discord_username = '',
  nationality = '',
  phone = '',
  whatsapp = '',
  sections_order = '["hero","about","skills","education","repos","cv_projects","awards","contact"]'::jsonb,
  sections_visible = '{"hero":true,"about":true,"skills":true,"education":true,"repos":true,"cv_projects":true,"awards":true,"contact":true}'::jsonb,
  theme = 'dark',
  accent_color = '#3b82f6',
  skills = '[]'::jsonb,
  education = '[]'::jsonb,
  cv_projects = '[]'::jsonb,
  awards = '[]'::jsonb,
  languages = '[]'::jsonb,
  digital_skills = '[]'::jsonb,
  updated_at = now()
WHERE id = 1;
