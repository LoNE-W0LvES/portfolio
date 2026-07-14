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
  sections_order jsonb NOT NULL DEFAULT '["hero","about","skills","experience","education","repos","cv_projects","awards","contact"]'::jsonb,
  sections_visible jsonb NOT NULL DEFAULT '{"hero":true,"about":true,"skills":true,"experience":true,"education":true,"repos":true,"cv_projects":true,"awards":true,"contact":true}'::jsonb,
  theme text NOT NULL DEFAULT 'dark',
  accent_color text NOT NULL DEFAULT '#3b82f6',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  nationality text NOT NULL DEFAULT '',
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  work_experience jsonb NOT NULL DEFAULT '[]'::jsonb,
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
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_user_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES site_users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  is_primary boolean NOT NULL DEFAULT false,
  auth_user_id uuid UNIQUE,
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

CREATE OR REPLACE FUNCTION public.is_site_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM site_user_emails e JOIN site_users u ON u.id = e.user_id
    WHERE lower(e.email) = lower(auth.jwt() ->> 'email') AND u.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_site_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM site_user_emails
  WHERE lower(email) = lower(auth.jwt() ->> 'email') LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.is_site_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_site_user_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_user_email_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT role FROM site_users WHERE id = NEW.user_id) = 'user'
     AND EXISTS (SELECT 1 FROM site_user_emails WHERE user_id = NEW.user_id AND id <> NEW.id) THEN
    RAISE EXCEPTION 'Regular users can have only one login email';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_user_email_limit_trigger ON site_user_emails;
CREATE TRIGGER enforce_user_email_limit_trigger BEFORE INSERT OR UPDATE ON site_user_emails
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_email_limit();

-- Every new Supabase Auth identity receives a regular one-email site account.
-- Existing admin emails are attached to their pre-seeded admin identity instead.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing_user_id uuid;
BEGIN
  SELECT user_id INTO existing_user_id FROM site_user_emails WHERE lower(email) = lower(NEW.email) LIMIT 1;
  IF existing_user_id IS NOT NULL THEN
    UPDATE site_user_emails SET auth_user_id = NEW.id WHERE lower(email) = lower(NEW.email);
  ELSE
    INSERT INTO site_users (handle, display_name, role)
    VALUES (split_part(NEW.email, '@', 1), COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''), 'user')
    RETURNING id INTO existing_user_id;
    INSERT INTO site_user_emails (user_id, email, is_primary, auth_user_id)
    VALUES (existing_user_id, lower(NEW.email), true, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Initial administrator: one logical account with three permitted login emails.
DO $$
DECLARE admin_id uuid;
BEGIN
  SELECT user_id INTO admin_id FROM site_user_emails
  WHERE lower(email) IN ('nafimnr00@gmail.com','nafimnr05@gmail.com','nafithelonewolves@gmail.com') LIMIT 1;
  IF admin_id IS NULL THEN
    INSERT INTO site_users (handle, display_name, role)
    VALUES ('nafim', 'MD Nafiur Rahman', 'admin') RETURNING id INTO admin_id;
  ELSE
    UPDATE site_users SET role = 'admin' WHERE id = admin_id;
  END IF;
  INSERT INTO site_user_emails (user_id, email, is_primary, auth_user_id)
  SELECT admin_id, values_table.email, values_table.is_primary, auth_user.id
  FROM (VALUES
    ('nafimnr00@gmail.com', true),
    ('nafimnr05@gmail.com', false),
    ('nafithelonewolves@gmail.com', false)
  ) AS values_table(email, is_primary)
  LEFT JOIN auth.users auth_user ON lower(auth_user.email) = lower(values_table.email)
  ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id, auth_user_id = COALESCE(EXCLUDED.auth_user_id, site_user_emails.auth_user_id);
END $$;

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
  TO authenticated USING (id = public.current_site_user_id() OR public.is_site_admin());

DROP POLICY IF EXISTS "auth_insert_site_users" ON site_users;
CREATE POLICY "auth_insert_site_users" ON site_users FOR INSERT
  TO authenticated WITH CHECK (public.is_site_admin());

DROP POLICY IF EXISTS "auth_update_site_users" ON site_users;
CREATE POLICY "auth_update_site_users" ON site_users FOR UPDATE
  TO authenticated USING (public.is_site_admin()) WITH CHECK (public.is_site_admin());

DROP POLICY IF EXISTS "auth_delete_site_users" ON site_users;
CREATE POLICY "auth_delete_site_users" ON site_users FOR DELETE
  TO authenticated USING (public.is_site_admin());

DROP POLICY IF EXISTS "auth_select_site_user_emails" ON site_user_emails;
CREATE POLICY "auth_select_site_user_emails" ON site_user_emails FOR SELECT
  TO authenticated USING (lower(email) = lower(auth.jwt() ->> 'email') OR public.is_site_admin());

DROP POLICY IF EXISTS "auth_insert_site_user_emails" ON site_user_emails;
CREATE POLICY "auth_insert_site_user_emails" ON site_user_emails FOR INSERT
  TO authenticated WITH CHECK (public.is_site_admin());

DROP POLICY IF EXISTS "auth_update_site_user_emails" ON site_user_emails;
CREATE POLICY "auth_update_site_user_emails" ON site_user_emails FOR UPDATE
  TO authenticated USING (public.is_site_admin()) WITH CHECK (public.is_site_admin());

DROP POLICY IF EXISTS "auth_delete_site_user_emails" ON site_user_emails;
CREATE POLICY "auth_delete_site_user_emails" ON site_user_emails FOR DELETE
  TO authenticated USING (public.is_site_admin());

-- Public avatar bucket. Only authenticated emails in the site's allowlist may
-- list, upload, or delete objects; visitors can display files via public URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "owner_select_avatars" ON storage.objects;
CREATE POLICY "owner_select_avatars" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.site_user_emails
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "owner_insert_avatars" ON storage.objects;
CREATE POLICY "owner_insert_avatars" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.site_user_emails
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

DROP POLICY IF EXISTS "owner_delete_avatars" ON storage.objects;
CREATE POLICY "owner_delete_avatars" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.site_user_emails
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Notes:
-- 1) This schema separates logical users (site_users) from emails (site_user_emails)
--    so a single account can hold multiple emails for redundancy as requested.
-- 2) Actual Supabase Auth users (in auth.users) are still needed if you want
--    to use Supabase's built-in authentication flows (magic links/passwords).
--    Use server-side Admin API or CLI to create auth users and ensure their emails
--    match entries in site_user_emails, or implement a login guard that checks
--    site_user_emails before allowing profile edits.

