-- Debug and fix RLS policies - more explicit approach

-- First, let's disable RLS temporarily on users table to test
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Re-enable it after we verify the structure
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access to users" ON public.users;
DROP POLICY IF EXISTS "Allow user creation via trigger" ON public.users;

-- Create very permissive policies for debugging
CREATE POLICY "Allow authenticated users to read users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow service role full access" ON public.users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow user insertion" ON public.users
  FOR INSERT WITH CHECK (true);
