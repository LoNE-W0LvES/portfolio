-- Run this once in the Supabase SQL Editor for an existing deployment.
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
