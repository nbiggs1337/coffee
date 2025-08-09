-- Add phone_number column to the posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS phone_number TEXT;
