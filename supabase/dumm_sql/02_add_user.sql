-- Dummy template: create one logical site user + login emails
-- Run after 01_schema.sql
-- Replace values before use.

DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Replace with your handle/display name
  SELECT id INTO user_uuid FROM site_users WHERE handle = 'user' LIMIT 1;
  IF user_uuid IS NULL THEN
    INSERT INTO site_users (handle, display_name)
    VALUES ('user', 'user')
    RETURNING id INTO user_uuid;
  END IF;

  -- Replace emails. Keep at least one row; add more rows if needed.
  INSERT INTO site_user_emails (user_id, email, is_primary)
  VALUES
    (user_uuid, 'user@example.com', true),
    (user_uuid, 'user.backup@example.com', false)
  ON CONFLICT (email) DO UPDATE
    SET user_id = EXCLUDED.user_id;
END $$;

-- Note:
-- For Supabase Auth sign-in, also create matching auth.users entries
-- through Supabase Admin API/CLI using these same emails.
