-- Check if the trigger exists and is working
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if there are any users in auth.users but not in public.users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  pu.id as public_user_id,
  pu.created_at as public_created
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- If the trigger isn't working, let's manually create the missing user record
-- Replace the ID and email with your actual values from the debug output
INSERT INTO public.users (id, email, is_approved, is_admin)
VALUES ('47e08e79-cb5c-40b7-ba5b-9cc2c0a35c5b', 'nbiggs1337@gmail.com', false, false)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();
