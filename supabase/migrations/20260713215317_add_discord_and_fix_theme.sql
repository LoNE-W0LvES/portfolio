/*
# Add discord_username to portfolio_settings

Adds a discord_username column and updates the seed data.
Also removes the 'auto' theme option — only 'light' and 'dark' now.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='portfolio_settings' AND column_name='discord_username') THEN
    ALTER TABLE portfolio_settings ADD COLUMN discord_username text NOT NULL DEFAULT '';
  END IF;
END $$;

UPDATE portfolio_settings SET
  discord_username = 'lonewolves',
  theme = 'dark',
  updated_at = now()
WHERE id = 1;
