-- Migration to insert personal account and seed portfolio settings
-- Run after schema.sql in a fresh Supabase DB

-- Create a single site user for MD Nafiur Rahman (or "nafim" handle)
DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- If a user with this handle exists, reuse it
  SELECT id INTO user_uuid FROM site_users WHERE handle = 'nafim' LIMIT 1;
  IF user_uuid IS NULL THEN
    INSERT INTO site_users (handle, display_name) VALUES ('nafim','MD Nafiur Rahman') RETURNING id INTO user_uuid;
  END IF;

  -- Insert provided emails; set the first as primary
  INSERT INTO site_user_emails (user_id, email, is_primary)
  VALUES
    (user_uuid, 'nafimnr00@gmail.com', true),
    (user_uuid, 'nafimnr05@gmail.com', false),
    (user_uuid, 'nafithelonewolves@gmail.com', false)
  ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id;
END $$;

-- Update portfolio_settings row with starter personal data (not including login emails)
UPDATE portfolio_settings SET
  github_username = 'LoNE-W0LvES',
  display_name = 'MD Nafiur Rahman',
  title = 'CSE Student & IoT / Embedded Systems Developer',
  bio = 'I aim to use my programming knowledge and hardware skills to reduce import dependency and empower our country with locally developed technologies.',
  avatar_url = 'https://avatars.githubusercontent.com/u/LoNE-W0LvES?v=4',
  email = '170151.cse@student.just.edu.bd',
  location = 'Dhaka, Bangladesh',
  linkedin_url = 'https://www.linkedin.com/in/md-nafiur-rahman',
  nationality = 'Bangladeshi',
  phone = '+880 1521257588',
  whatsapp = '+8801521257588',
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

-- Notes:
-- 1) This migration creates a site_user and links three emails for redundancy.
-- 2) To use Supabase's auth system (magic links, sign-ins), create matching
--    entries in auth.users via the Supabase Admin API or CLI and ensure the
--    email fields match these entries.
-- 3) For other people, copy migrate_personal.sql and change the handle/display_name/emails.

