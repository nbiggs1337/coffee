-- Verify bucket and policies without mutating anything
SELECT id, name, public FROM storage.buckets WHERE id = 'photos';

SELECT policyname
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
