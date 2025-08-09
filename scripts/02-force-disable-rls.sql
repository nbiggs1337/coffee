-- Force disable RLS and check current state
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Force disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Also drop all policies to be sure
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update own record" ON public.users;
DROP POLICY IF EXISTS "Allow service role full access" ON public.users;
DROP POLICY IF EXISTS "Allow user insertion" ON public.users;

-- Check if user exists and create if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = '47e08e79-cb5c-40b7-ba5b-9cc2c0a35c5b') THEN
        INSERT INTO public.users (id, email, is_approved, is_admin)
        VALUES ('47e08e79-cb5c-40b7-ba5b-9cc2c0a35c5b', 'nbiggs1337@gmail.com', true, true);
        RAISE NOTICE 'User created successfully';
    ELSE
        UPDATE public.users 
        SET is_approved = true, is_admin = true 
        WHERE id = '47e08e79-cb5c-40b7-ba5b-9cc2c0a35c5b';
        RAISE NOTICE 'User updated successfully';
    END IF;
END $$;
