-- Fix RLS for Supabase Storage uploads to the "post-images" bucket
-- This script allows:
--  - Public read access to images in the "post-images" bucket (optional, remove if you don't want public reads)
--  - Authenticated users to upload new files into their own folder (prefix path with their auth.uid())

-- Note: Policies must be created on the "storage.objects" table.
-- See Supabase docs for storage upload permissions and RLS requirements [^2][^4].

-- 1) Public read access (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read on post-images'
  ) THEN
    CREATE POLICY "Public read on post-images"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'post-images');
  END IF;
END $$;

-- 2) Allow authenticated users to upload to their own folder
-- Enforces that the object path (name) starts with "<auth.uid()>/"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload to their folder (post-images)'
  ) THEN
    CREATE POLICY "Authenticated users can upload to their folder (post-images)"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'post-images'
        AND position(auth.uid()::text || '/' IN name) = 1
      );
  END IF;
END $$;

-- 3) (Optional) Allow authenticated users to update files in their own folder
-- Only needed if you support replacing files after upload.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can update their files (post-images)'
  ) THEN
    CREATE POLICY "Authenticated users can update their files (post-images)"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'post-images'
        AND position(auth.uid()::text || '/' IN name) = 1
      )
      WITH CHECK (
        bucket_id = 'post-images'
        AND position(auth.uid()::text || '/' IN name) = 1
      );
  END IF;
END $$;

-- 4) (Optional) Allow authenticated users to delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can delete their files (post-images)'
  ) THEN
    CREATE POLICY "Authenticated users can delete their files (post-images)"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'post-images'
        AND position(auth.uid()::text || '/' IN name) = 1
      );
  END IF;
END $$;
