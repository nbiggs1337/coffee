-- Re-enable RLS after testing
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

SELECT 'RLS has been re-enabled on posts and users tables.' as status;
