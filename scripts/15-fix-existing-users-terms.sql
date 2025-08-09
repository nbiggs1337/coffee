-- Update existing approved users to have agreed_to_terms = true
-- This fixes the issue where existing users get redirected to /agreement after login
UPDATE public.users 
SET agreed_to_terms = TRUE, updated_at = NOW()
WHERE is_approved = TRUE 
  AND (agreed_to_terms IS NULL OR agreed_to_terms = FALSE);

-- Specifically ensure the admin user has all required fields
UPDATE public.users 
SET 
  agreed_to_terms = TRUE,
  full_name = COALESCE(full_name, 'Admin User'),
  verification_photo_url = COALESCE(verification_photo_url, '/placeholder.svg?height=200&width=200'),
  updated_at = NOW()
WHERE email = 'nbiggs1337@gmail.com';

-- Show the results
SELECT id, email, full_name, is_approved, is_admin, agreed_to_terms, 
       CASE WHEN verification_photo_url IS NOT NULL THEN 'Has photo' ELSE 'No photo' END as photo_status
FROM public.users 
WHERE is_approved = TRUE OR email = 'nbiggs1337@gmail.com';
