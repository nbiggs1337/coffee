-- Temporarily disable RLS for testing swipe functionality
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

SELECT 'RLS has been temporarily disabled on posts and users tables for testing.' as status;
