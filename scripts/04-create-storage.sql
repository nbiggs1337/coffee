-- Storage policies ONLY (no bucket creation here)
-- These are safe to re-run.

DROP POLICY IF EXISTS "Photos: users can upload their own" ON storage.objects;
CREATE POLICY "Photos: users can upload their own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Photos: public read" ON storage.objects;
CREATE POLICY "Photos: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Photos: users can update their own" ON storage.objects;
CREATE POLICY "Photos: users can update their own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Photos: users can delete their own" ON storage.objects;
CREATE POLICY "Photos: users can delete their own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
