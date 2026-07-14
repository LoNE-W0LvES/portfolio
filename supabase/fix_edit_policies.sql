-- Run this in the Supabase SQL Editor if the edit page cannot save changes.
-- It restores the policies required by the current authenticated-owner flow.

ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON public.portfolio_settings;
CREATE POLICY "anon_select_settings" ON public.portfolio_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_settings" ON public.portfolio_settings;
CREATE POLICY "auth_update_settings" ON public.portfolio_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON TABLE public.portfolio_settings TO anon, authenticated;
GRANT UPDATE ON TABLE public.portfolio_settings TO authenticated;
