-- Create a test user for debugging (run this manually if needed)
-- Replace 'your-email@example.com' with your actual email

-- First, you'll need to sign up through the UI or Supabase auth
-- Then run this to make that user an admin:

-- UPDATE public.users 
-- SET is_admin = TRUE, is_approved = TRUE 
-- WHERE email = 'your-email@example.com';

-- Or if you know the user ID:
-- UPDATE public.users 
-- SET is_admin = TRUE, is_approved = TRUE 
-- WHERE id = 'your-user-id-here';

-- Check current users:
SELECT id, email, is_approved, is_admin, created_at FROM public.users;
