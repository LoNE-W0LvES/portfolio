CREATE TABLE IF NOT EXISTS public.donation_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  website_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.donation_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.donation_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), platform_name text NOT NULL, payment_url text NOT NULL,
  account_name text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', icon_url text NOT NULL DEFAULT '',
  website_visible boolean NOT NULL DEFAULT true, api_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS set_updated_at_donation_settings ON public.donation_settings;
CREATE TRIGGER set_updated_at_donation_settings BEFORE UPDATE ON public.donation_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_donation_methods ON public.donation_methods;
CREATE TRIGGER set_updated_at_donation_methods BEFORE UPDATE ON public.donation_methods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_donation_settings" ON public.donation_settings;
CREATE POLICY "public_select_donation_settings" ON public.donation_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_update_donation_settings" ON public.donation_settings;
CREATE POLICY "admin_update_donation_settings" ON public.donation_settings FOR UPDATE TO authenticated USING (public.is_site_admin()) WITH CHECK (public.is_site_admin());
DROP POLICY IF EXISTS "public_select_donation_methods" ON public.donation_methods;
CREATE POLICY "public_select_donation_methods" ON public.donation_methods FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_insert_donation_methods" ON public.donation_methods;
CREATE POLICY "admin_insert_donation_methods" ON public.donation_methods FOR INSERT TO authenticated WITH CHECK (public.is_site_admin());
DROP POLICY IF EXISTS "admin_update_donation_methods" ON public.donation_methods;
CREATE POLICY "admin_update_donation_methods" ON public.donation_methods FOR UPDATE TO authenticated USING (public.is_site_admin()) WITH CHECK (public.is_site_admin());
DROP POLICY IF EXISTS "admin_delete_donation_methods" ON public.donation_methods;
CREATE POLICY "admin_delete_donation_methods" ON public.donation_methods FOR DELETE TO authenticated USING (public.is_site_admin());
CREATE OR REPLACE FUNCTION public.is_username_available(candidate text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT lower(candidate) ~ '^[a-z0-9_-]{3,30}$'
    AND lower(candidate) NOT IN ('edit','api','admin','login','signup','lonewolves','donate','donation')
    AND NOT EXISTS (SELECT 1 FROM site_users WHERE handle=lower(candidate));
$$;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;
