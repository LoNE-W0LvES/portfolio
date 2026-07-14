-- Consolidated schema for portfolio app (supabase)
-- Run this first to create all necessary tables, extensions, and policies.

-- pgcrypto provides gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper: update updated_at timestamp on row changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

-- Single-owner portfolio settings (one row, id = 1)
CREATE TABLE IF NOT EXISTS portfolio_settings (
  id integer PRIMARY KEY DEFAULT 1,
  github_username text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  about_text text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '', -- public contact email (visible on site)
  location text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  twitter_url text NOT NULL DEFAULT '',
  discord_username text NOT NULL DEFAULT '',
  sections_order jsonb NOT NULL DEFAULT '["hero","about","repos","contact"]'::jsonb,
  sections_visible jsonb NOT NULL DEFAULT '{"hero":true,"about":true,"repos":true,"contact":true}'::jsonb,
  theme text NOT NULL DEFAULT 'dark',
  accent_color text NOT NULL DEFAULT '#3b82f6',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  nationality text NOT NULL DEFAULT '',
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  cv_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  awards jsonb NOT NULL DEFAULT '[]'::jsonb,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  digital_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure single settings row exists
INSERT INTO portfolio_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- repo visibility toggles
CREATE TABLE IF NOT EXISTS repo_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_name text NOT NULL UNIQUE,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Site user model: one logical user can have multiple emails (for redundancy)
CREATE TABLE IF NOT EXISTS site_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text NOT NULL DEFAULT '', -- internal handle (e.g., github or short name)
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_user_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES site_users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Triggers to keep updated_at fresh
DROP TRIGGER IF EXISTS set_updated_at_portfolio_settings ON portfolio_settings;
CREATE TRIGGER set_updated_at_portfolio_settings
BEFORE UPDATE ON portfolio_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_repo_visibility ON repo_visibility;
CREATE TRIGGER set_updated_at_repo_visibility
BEFORE UPDATE ON repo_visibility
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_site_users ON site_users;
CREATE TRIGGER set_updated_at_site_users
BEFORE UPDATE ON site_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_site_user_emails ON site_user_emails;
CREATE TRIGGER set_updated_at_site_user_emails
BEFORE UPDATE ON site_user_emails
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable Row Level Security where appropriate
ALTER TABLE portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_user_emails ENABLE ROW LEVEL SECURITY;

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

-- repo_visibility policies (public read)
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

-- site_users and site_user_emails policies
-- These should NOT be readable by anon users (emails are private, used for login only)
DROP POLICY IF EXISTS "auth_select_site_users" ON site_users;
CREATE POLICY "auth_select_site_users" ON site_users FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_site_users" ON site_users;
CREATE POLICY "auth_insert_site_users" ON site_users FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_site_users" ON site_users;
CREATE POLICY "auth_update_site_users" ON site_users FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_site_users" ON site_users;
CREATE POLICY "auth_delete_site_users" ON site_users FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_select_site_user_emails" ON site_user_emails;
CREATE POLICY "auth_select_site_user_emails" ON site_user_emails FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_site_user_emails" ON site_user_emails;
CREATE POLICY "auth_insert_site_user_emails" ON site_user_emails FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_site_user_emails" ON site_user_emails;
CREATE POLICY "auth_update_site_user_emails" ON site_user_emails FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_site_user_emails" ON site_user_emails;
CREATE POLICY "auth_delete_site_user_emails" ON site_user_emails FOR DELETE
  TO authenticated USING (true);

-- Notes:
-- 1) This schema separates logical users (site_users) from emails (site_user_emails)
--    so a single account can hold multiple emails for redundancy as requested.
-- 2) Actual Supabase Auth users (in auth.users) are still needed if you want
--    to use Supabase's built-in authentication flows (magic links/passwords).
--    Use server-side Admin API or CLI to create auth users and ensure their emails
--    match entries in site_user_emails, or implement a login guard that checks
--    site_user_emails before allowing profile edits.

