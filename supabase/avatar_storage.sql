-- Run fix_multi_tenant_approval.sql before this file.
-- New deployments receive the same setup from schema.sql.

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
    AND (public.is_site_admin() OR (public.is_site_verified() AND (storage.foldername(name))[1] = public.current_site_user_id()::text))
  );

DROP POLICY IF EXISTS "owner_insert_avatars" ON storage.objects;
CREATE POLICY "owner_insert_avatars" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (public.is_site_admin() OR (public.is_site_verified() AND (storage.foldername(name))[1] = public.current_site_user_id()::text))
  );

DROP POLICY IF EXISTS "owner_delete_avatars" ON storage.objects;
CREATE POLICY "owner_delete_avatars" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (public.is_site_admin() OR (public.is_site_verified() AND (storage.foldername(name))[1] = public.current_site_user_id()::text))
  );
