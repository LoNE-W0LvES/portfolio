-- Run once in the Supabase SQL Editor for an existing database.
ALTER TABLE public.site_users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE public.site_users DROP CONSTRAINT IF EXISTS site_users_role_check;
ALTER TABLE public.site_users ADD CONSTRAINT site_users_role_check CHECK (role IN ('admin', 'user'));
ALTER TABLE public.site_user_emails ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

UPDATE public.site_user_emails e SET auth_user_id = a.id
FROM auth.users a WHERE lower(a.email) = lower(e.email) AND e.auth_user_id IS NULL;

UPDATE public.site_users u SET role = 'admin'
WHERE EXISTS (SELECT 1 FROM public.site_user_emails e WHERE e.user_id = u.id AND lower(e.email) IN
  ('nafimnr00@gmail.com','nafimnr05@gmail.com','nafithelonewolves@gmail.com'));

CREATE OR REPLACE FUNCTION public.is_site_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM site_user_emails e JOIN site_users u ON u.id=e.user_id
    WHERE lower(e.email)=lower(auth.jwt()->>'email') AND u.role='admin');
$$;
CREATE OR REPLACE FUNCTION public.current_site_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM site_user_emails WHERE lower(email)=lower(auth.jwt()->>'email') LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.is_site_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_site_user_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_user_email_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT role FROM site_users WHERE id=NEW.user_id)='user'
    AND EXISTS (SELECT 1 FROM site_user_emails WHERE user_id=NEW.user_id AND id<>NEW.id) THEN
    RAISE EXCEPTION 'Regular users can have only one login email';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS enforce_user_email_limit_trigger ON public.site_user_emails;
CREATE TRIGGER enforce_user_email_limit_trigger BEFORE INSERT OR UPDATE ON public.site_user_emails
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_email_limit();

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing_user_id uuid;
BEGIN
  SELECT user_id INTO existing_user_id FROM site_user_emails WHERE lower(email)=lower(NEW.email) LIMIT 1;
  IF existing_user_id IS NOT NULL THEN
    UPDATE site_user_emails SET auth_user_id=NEW.id WHERE lower(email)=lower(NEW.email);
  ELSE
    INSERT INTO site_users (handle, display_name, role)
    VALUES (split_part(NEW.email,'@',1), COALESCE(NEW.raw_user_meta_data->>'display_name',''), 'user') RETURNING id INTO existing_user_id;
    INSERT INTO site_user_emails (user_id,email,is_primary,auth_user_id)
    VALUES (existing_user_id,lower(NEW.email),true,NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

DROP POLICY IF EXISTS "auth_select_site_users" ON public.site_users;
CREATE POLICY "auth_select_site_users" ON public.site_users FOR SELECT TO authenticated
USING (id=public.current_site_user_id() OR public.is_site_admin());
DROP POLICY IF EXISTS "auth_insert_site_users" ON public.site_users;
CREATE POLICY "auth_insert_site_users" ON public.site_users FOR INSERT TO authenticated WITH CHECK (public.is_site_admin());
DROP POLICY IF EXISTS "auth_update_site_users" ON public.site_users;
CREATE POLICY "auth_update_site_users" ON public.site_users FOR UPDATE TO authenticated USING (public.is_site_admin()) WITH CHECK (public.is_site_admin());
DROP POLICY IF EXISTS "auth_delete_site_users" ON public.site_users;
CREATE POLICY "auth_delete_site_users" ON public.site_users FOR DELETE TO authenticated USING (public.is_site_admin());
DROP POLICY IF EXISTS "auth_select_site_user_emails" ON public.site_user_emails;
CREATE POLICY "auth_select_site_user_emails" ON public.site_user_emails FOR SELECT TO authenticated
USING (lower(email)=lower(auth.jwt()->>'email') OR public.is_site_admin());
DROP POLICY IF EXISTS "auth_insert_site_user_emails" ON public.site_user_emails;
CREATE POLICY "auth_insert_site_user_emails" ON public.site_user_emails FOR INSERT TO authenticated WITH CHECK (public.is_site_admin());
DROP POLICY IF EXISTS "auth_update_site_user_emails" ON public.site_user_emails;
CREATE POLICY "auth_update_site_user_emails" ON public.site_user_emails FOR UPDATE TO authenticated USING (public.is_site_admin()) WITH CHECK (public.is_site_admin());
DROP POLICY IF EXISTS "auth_delete_site_user_emails" ON public.site_user_emails;
CREATE POLICY "auth_delete_site_user_emails" ON public.site_user_emails FOR DELETE TO authenticated USING (public.is_site_admin());
