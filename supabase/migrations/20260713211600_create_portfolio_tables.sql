/*
# Portfolio CMS Schema

## Purpose
Stores portfolio settings and GitHub repo visibility preferences for a single-owner portfolio site.

## Tables

### portfolio_settings
Stores all configurable portfolio content and appearance settings.
- id: primary key (always one row)
- github_username: GitHub username to fetch repos from
- display_name: name shown on portfolio
- title: headline/role
- bio: about section text
- avatar_url: profile image URL
- email: contact email shown
- location: location text
- website_url: personal website link
- linkedin_url: LinkedIn profile URL
- twitter_url: Twitter/X URL
- sections_order: JSON array defining section order (e.g. ["hero","about","repos","contact"])
- sections_visible: JSON object of section visibility flags
- theme: 'light' | 'dark' | 'auto'
- accent_color: hex color string
- created_at / updated_at: timestamps

### repo_visibility
Controls whether individual GitHub repos appear on the portfolio.
- id: primary key
- repo_name: full repo name (owner/repo)
- visible: boolean, defaults true (show all by default)
- created_at / updated_at

## Security
- RLS enabled on both tables.
- Only authenticated users can write; anon can read (portfolio is public).
- No user_id scoping — single-owner portfolio.
*/

CREATE TABLE IF NOT EXISTS portfolio_settings (
  id integer PRIMARY KEY DEFAULT 1,
  github_username text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  twitter_url text NOT NULL DEFAULT '',
  sections_order jsonb NOT NULL DEFAULT '["hero","about","repos","contact"]'::jsonb,
  sections_visible jsonb NOT NULL DEFAULT '{"hero":true,"about":true,"repos":true,"contact":true}'::jsonb,
  theme text NOT NULL DEFAULT 'dark',
  accent_color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed the single settings row
INSERT INTO portfolio_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS repo_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_name text NOT NULL UNIQUE,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_visibility ENABLE ROW LEVEL SECURITY;

-- portfolio_settings policies
DROP POLICY IF EXISTS "anon_select_settings" ON portfolio_settings;
CREATE POLICY "anon_select_settings" ON portfolio_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_settings" ON portfolio_settings;
CREATE POLICY "auth_insert_settings" ON portfolio_settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_settings" ON portfolio_settings;
CREATE POLICY "auth_update_settings" ON portfolio_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_settings" ON portfolio_settings;
CREATE POLICY "auth_delete_settings" ON portfolio_settings FOR DELETE
  TO authenticated USING (true);

-- repo_visibility policies
DROP POLICY IF EXISTS "anon_select_repo_visibility" ON repo_visibility;
CREATE POLICY "anon_select_repo_visibility" ON repo_visibility FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_repo_visibility" ON repo_visibility;
CREATE POLICY "auth_insert_repo_visibility" ON repo_visibility FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_repo_visibility" ON repo_visibility;
CREATE POLICY "auth_update_repo_visibility" ON repo_visibility FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_repo_visibility" ON repo_visibility;
CREATE POLICY "auth_delete_repo_visibility" ON repo_visibility FOR DELETE
  TO authenticated USING (true);
