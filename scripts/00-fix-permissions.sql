-- Fix fundamental permissions issue and ensure user record exists/is approved
-- Grant necessary permissions to service roles and authenticated users

-- Grant usage on public schema to all roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant all privileges on all tables in public schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant all privileges on all sequences in public schema  
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant all privileges on all functions in public schema
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- Ensure the users table exists and has proper ownership
ALTER TABLE public.users OWNER TO postgres;

-- Disable RLS on users table completely for now (for debugging)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Ensure your specific user record exists and is approved/admin
DO $$
DECLARE
    user_id_val UUID := '47e08e79-cb5c-40b7-ba5b-9cc2c0a35c5b';
    user_email_val TEXT := 'nbiggs1337@gmail.com';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id_val) THEN
        INSERT INTO public.users (id, email, is_approved, is_admin, created_at, updated_at)
        VALUES (user_id_val, user_email_val, true, true, NOW(), NOW());
        RAISE NOTICE 'User % created successfully and set as approved/admin.', user_email_val;
    ELSE
        UPDATE public.users 
        SET is_approved = true, is_admin = true, updated_at = NOW()
        WHERE id = user_id_val;
        RAISE NOTICE 'User % updated successfully and set as approved/admin.', user_email_val;
    END IF;
END $$;

-- Verify the insert/update worked
SELECT id, email, is_approved, is_admin FROM public.users WHERE id = '47e08e79-cb5c-40b7-ba5b-9cc2c0a35c5b';
