-- Add is_rejected column to public.users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT FALSE;

-- Ensure the default value is applied to existing rows if the column was just added
UPDATE public.users
SET is_rejected = FALSE
WHERE is_rejected IS NULL;
