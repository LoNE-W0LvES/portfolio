-- Critical migration: isolate portfolios per user and require admin approval.
-- Run once in the Supabase SQL Editor on the existing database.

ALTER TABLE public.site_users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.site_users ADD COLUMN IF NOT EXISTS username_set boolean NOT NULL DEFAULT false;
ALTER TABLE public.site_users DROP CONSTRAINT IF EXISTS site_users_status_check;
ALTER TABLE public.site_users ADD CONSTRAINT site_users_status_check CHECK (status IN ('pending','verified'));
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS viewer_theme text NOT NULL DEFAULT 'default';
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS show_light_mode_bugs boolean NOT NULL DEFAULT false;
ALTER TABLE public.portfolio_settings ADD COLUMN IF NOT EXISTS contacts jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.portfolio_settings DROP CONSTRAINT IF EXISTS portfolio_settings_viewer_theme_check;
ALTER TABLE public.portfolio_settings ADD CONSTRAINT portfolio_settings_viewer_theme_check CHECK(viewer_theme IN ('default','kinetic'));

UPDATE public.portfolio_settings p SET contacts = COALESCE((
  SELECT jsonb_agg(jsonb_build_object('platform_name', v.name, 'platform_link', v.link, 'platform_username', v.username))
  FROM (VALUES
    ('Email', CASE WHEN p.email<>'' THEN 'mailto:'||p.email ELSE '' END, p.email),
    ('Phone', CASE WHEN p.phone<>'' THEN 'tel:'||regexp_replace(p.phone,'\s','','g') ELSE '' END, p.phone),
    ('WhatsApp', CASE WHEN p.whatsapp<>'' THEN 'https://wa.me/'||regexp_replace(p.whatsapp,'\D','','g') ELSE '' END, p.whatsapp),
    ('LinkedIn', p.linkedin_url, 'Connect'),
    ('GitHub', CASE WHEN p.github_username<>'' THEN 'https://github.com/'||p.github_username ELSE '' END, CASE WHEN p.github_username<>'' THEN '@'||p.github_username ELSE '' END),
    ('Discord', CASE WHEN p.discord_username<>'' THEN 'https://discord.com/' ELSE '' END, p.discord_username),
    ('Twitter / X', p.twitter_url, 'Follow'),
    ('Website', p.website_url, 'Visit website')
  ) AS v(name,link,username) WHERE v.link<>''
), '[]'::jsonb) WHERE p.contacts='[]'::jsonb;
ALTER TABLE public.repo_visibility ADD COLUMN IF NOT EXISTS owner_id uuid;

UPDATE public.site_users SET handle='lonewolves', username_set=true WHERE role='admin';
UPDATE public.site_users u SET
  username_set = (NULLIF(a.raw_user_meta_data->>'username','') IS NOT NULL),
  handle = CASE
    WHEN NULLIF(a.raw_user_meta_data->>'username','') IS NOT NULL THEN lower(a.raw_user_meta_data->>'username')
    ELSE 'pending_'||left(replace(a.id::text,'-',''),20)
  END
FROM public.site_user_emails e JOIN auth.users a ON a.id=e.auth_user_id
WHERE e.user_id=u.id AND u.role='user';
UPDATE public.site_users SET status='pending' WHERE role='user' AND username_set=false;
ALTER TABLE public.site_users DROP CONSTRAINT IF EXISTS site_users_handle_key;
ALTER TABLE public.site_users ADD CONSTRAINT site_users_handle_key UNIQUE(handle);

UPDATE public.site_users SET status='verified' WHERE role='admin';
UPDATE public.portfolio_settings SET owner_id=(SELECT id FROM public.site_users WHERE role='admin' ORDER BY created_at LIMIT 1), is_primary=true, is_published=true, slug='lonewolves' WHERE id=1;
UPDATE public.repo_visibility SET owner_id=(SELECT id FROM public.site_users WHERE role='admin' ORDER BY created_at LIMIT 1) WHERE owner_id IS NULL;

CREATE SEQUENCE IF NOT EXISTS public.portfolio_settings_id_seq OWNED BY public.portfolio_settings.id;
SELECT setval('public.portfolio_settings_id_seq', GREATEST((SELECT COALESCE(MAX(id),1) FROM public.portfolio_settings),1));
ALTER TABLE public.portfolio_settings ALTER COLUMN id SET DEFAULT nextval('public.portfolio_settings_id_seq');

INSERT INTO public.portfolio_settings (owner_id, slug, display_name, email)
SELECT u.id, CASE WHEN u.username_set THEN lower(u.handle) ELSE NULL END, u.display_name, e.email FROM public.site_users u
LEFT JOIN public.site_user_emails e ON e.user_id=u.id AND e.is_primary=true
WHERE NOT EXISTS (SELECT 1 FROM public.portfolio_settings p WHERE p.owner_id=u.id);

ALTER TABLE public.portfolio_settings DROP CONSTRAINT IF EXISTS portfolio_settings_owner_id_key;
ALTER TABLE public.portfolio_settings ADD CONSTRAINT portfolio_settings_owner_id_key UNIQUE(owner_id);
UPDATE public.portfolio_settings p SET slug=CASE WHEN u.username_set THEN lower(u.handle) ELSE NULL END
FROM public.site_users u WHERE p.owner_id=u.id;
UPDATE public.portfolio_settings p SET is_published=false
FROM public.site_users u WHERE p.owner_id=u.id AND u.username_set=false;
ALTER TABLE public.portfolio_settings DROP CONSTRAINT IF EXISTS portfolio_settings_slug_key;
ALTER TABLE public.portfolio_settings ADD CONSTRAINT portfolio_settings_slug_key UNIQUE(slug);
ALTER TABLE public.portfolio_settings DROP CONSTRAINT IF EXISTS portfolio_settings_owner_id_fkey;
ALTER TABLE public.portfolio_settings ADD CONSTRAINT portfolio_settings_owner_id_fkey FOREIGN KEY(owner_id) REFERENCES public.site_users(id) ON DELETE CASCADE;
ALTER TABLE public.repo_visibility DROP CONSTRAINT IF EXISTS repo_visibility_repo_name_key;
ALTER TABLE public.repo_visibility DROP CONSTRAINT IF EXISTS repo_visibility_owner_repo_key;
ALTER TABLE public.repo_visibility ADD CONSTRAINT repo_visibility_owner_repo_key UNIQUE(owner_id,repo_name);
ALTER TABLE public.repo_visibility DROP CONSTRAINT IF EXISTS repo_visibility_owner_id_fkey;
ALTER TABLE public.repo_visibility ADD CONSTRAINT repo_visibility_owner_id_fkey FOREIGN KEY(owner_id) REFERENCES public.site_users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.current_site_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT user_id FROM site_user_emails
 WHERE auth_user_id=auth.uid() OR lower(email)=lower(auth.jwt()->>'email')
 ORDER BY (auth_user_id=auth.uid()) DESC LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_site_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM site_user_emails e JOIN site_users u ON u.id=e.user_id
 WHERE (e.auth_user_id=auth.uid() OR lower(e.email)=lower(auth.jwt()->>'email')) AND u.role='admin');
$$;

GRANT EXECUTE ON FUNCTION public.current_site_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_site_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_site_verified()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM site_user_emails e JOIN site_users u ON u.id=e.user_id
 WHERE (e.auth_user_id=auth.uid() OR lower(e.email)=lower(auth.jwt()->>'email')) AND u.status='verified');
$$;
GRANT EXECUTE ON FUNCTION public.is_site_verified() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_username_available(candidate text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT lower(candidate) ~ '^[a-z0-9_-]{3,30}$'
 AND lower(candidate) NOT IN ('edit','api','admin','login','signup','lonewolves')
 AND NOT EXISTS(SELECT 1 FROM site_users WHERE handle=lower(candidate));
$$;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.complete_username(candidate text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid;
BEGIN
 IF NOT public.is_username_available(candidate) THEN RAISE EXCEPTION 'Username is unavailable or reserved'; END IF;
 SELECT e.user_id INTO uid FROM site_user_emails e
 WHERE e.auth_user_id=auth.uid() OR lower(e.email)=lower(auth.jwt()->>'email')
 ORDER BY (e.auth_user_id=auth.uid()) DESC LIMIT 1;
 IF uid IS NULL THEN RAISE EXCEPTION 'Managed account not found'; END IF;
 IF (SELECT username_set FROM site_users WHERE id=uid) THEN RAISE EXCEPTION 'Username has already been set'; END IF;
 UPDATE site_users SET handle=lower(candidate),username_set=true WHERE id=uid;
 UPDATE portfolio_settings SET slug=lower(candidate) WHERE owner_id=uid;
END; $$;
GRANT EXECUTE ON FUNCTION public.complete_username(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE existing_user_id uuid;
DECLARE candidate text;
DECLARE has_username boolean;
BEGIN
 SELECT user_id INTO existing_user_id FROM site_user_emails WHERE lower(email)=lower(NEW.email) LIMIT 1;
 IF existing_user_id IS NOT NULL THEN
  UPDATE site_user_emails SET auth_user_id=NEW.id WHERE lower(email)=lower(NEW.email);
 ELSE
  has_username:=NULLIF(NEW.raw_user_meta_data->>'username','') IS NOT NULL;
  candidate:=CASE WHEN has_username THEN lower(NEW.raw_user_meta_data->>'username') ELSE 'pending_'||left(replace(NEW.id::text,'-',''),20) END;
  IF has_username AND NOT public.is_username_available(candidate) THEN RAISE EXCEPTION 'Invalid, reserved, or unavailable username'; END IF;
  INSERT INTO site_users(handle,display_name,role,status,username_set) VALUES(candidate,COALESCE(NEW.raw_user_meta_data->>'display_name',NEW.raw_user_meta_data->>'full_name',''),'user','pending',has_username) RETURNING id INTO existing_user_id;
  INSERT INTO site_user_emails(user_id,email,is_primary,auth_user_id) VALUES(existing_user_id,lower(NEW.email),true,NEW.id);
  INSERT INTO portfolio_settings(owner_id,slug,display_name,email) VALUES(existing_user_id,CASE WHEN has_username THEN candidate ELSE NULL END,COALESCE(NEW.raw_user_meta_data->>'display_name',NEW.raw_user_meta_data->>'full_name',''),lower(NEW.email));
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

DROP POLICY IF EXISTS "anon_select_settings" ON public.portfolio_settings;
CREATE POLICY "anon_select_settings" ON public.portfolio_settings FOR SELECT TO anon,authenticated
USING(is_primary OR is_published OR (owner_id=public.current_site_user_id() AND public.is_site_verified()) OR public.is_site_admin());
DROP POLICY IF EXISTS "auth_insert_settings" ON public.portfolio_settings;
CREATE POLICY "auth_insert_settings" ON public.portfolio_settings FOR INSERT TO authenticated
WITH CHECK((owner_id=public.current_site_user_id() AND public.is_site_verified()) OR public.is_site_admin());
DROP POLICY IF EXISTS "auth_update_settings" ON public.portfolio_settings;
CREATE POLICY "auth_update_settings" ON public.portfolio_settings FOR UPDATE TO authenticated
USING((owner_id=public.current_site_user_id() AND public.is_site_verified()) OR public.is_site_admin())
WITH CHECK((owner_id=public.current_site_user_id() AND public.is_site_verified()) OR public.is_site_admin());
DROP POLICY IF EXISTS "auth_delete_settings" ON public.portfolio_settings;
CREATE POLICY "auth_delete_settings" ON public.portfolio_settings FOR DELETE TO authenticated
USING((owner_id=public.current_site_user_id() AND public.is_site_verified()) OR public.is_site_admin());

DROP POLICY IF EXISTS "auth_insert_repo_visibility" ON public.repo_visibility;
CREATE POLICY "auth_insert_repo_visibility" ON public.repo_visibility FOR INSERT TO authenticated WITH CHECK(owner_id=public.current_site_user_id() AND public.is_site_verified());
DROP POLICY IF EXISTS "auth_update_repo_visibility" ON public.repo_visibility;
CREATE POLICY "auth_update_repo_visibility" ON public.repo_visibility FOR UPDATE TO authenticated USING(owner_id=public.current_site_user_id() AND public.is_site_verified()) WITH CHECK(owner_id=public.current_site_user_id() AND public.is_site_verified());
DROP POLICY IF EXISTS "auth_delete_repo_visibility" ON public.repo_visibility;
CREATE POLICY "auth_delete_repo_visibility" ON public.repo_visibility FOR DELETE TO authenticated USING(owner_id=public.current_site_user_id() AND public.is_site_verified());

DROP POLICY IF EXISTS "owner_select_avatars" ON storage.objects;
CREATE POLICY "owner_select_avatars" ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='avatars' AND (public.is_site_admin() OR (public.is_site_verified() AND (storage.foldername(name))[1]=public.current_site_user_id()::text)));
DROP POLICY IF EXISTS "owner_insert_avatars" ON storage.objects;
CREATE POLICY "owner_insert_avatars" ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='avatars' AND (public.is_site_admin() OR (public.is_site_verified() AND (storage.foldername(name))[1]=public.current_site_user_id()::text)));
DROP POLICY IF EXISTS "owner_delete_avatars" ON storage.objects;
CREATE POLICY "owner_delete_avatars" ON storage.objects FOR DELETE TO authenticated
USING(bucket_id='avatars' AND (public.is_site_admin() OR (public.is_site_verified() AND (storage.foldername(name))[1]=public.current_site_user_id()::text)));
