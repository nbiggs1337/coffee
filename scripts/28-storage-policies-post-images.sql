-- This script configures Row-Level Security (RLS) for the "verification-photos" bucket.
-- It allows any authenticated user to upload their verification photo.
-- This is safe because they can only insert and cannot see/modify other users' photos.

-- Note: The ALTER TABLE command has been removed as it requires table ownership
-- and RLS is typically enabled by default on Supabase projects.
-- This script now only creates the necessary policies.

-- 1. Policy: Allow any authenticated user to UPLOAD (INSERT) into "verification-photos".
-- This is the most important policy for the /agreement page to work.
-- It checks that the user has a valid session (is authenticated) and is targeting the correct bucket.
CREATE POLICY "Allow authenticated uploads to verification-photos"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'verification-photos'
);

-- 2. Policy: Allow users to VIEW (SELECT) their OWN verification photo.
-- This is useful if you ever want to display the photo back to the user.
-- It checks if the user's ID is in the file path (owner).
CREATE POLICY "Allow users to view their own verification photos"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'verification-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Policy: Allow users to UPDATE their OWN verification photo.
-- Useful if you allow re-uploads.
CREATE POLICY "Allow users to update their own verification photos"
ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'verification-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Policy: Allow users to DELETE their OWN verification photo.
CREATE POLICY "Allow users to delete their own verification photos"
ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'verification-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
