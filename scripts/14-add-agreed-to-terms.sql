-- Add a flag to track if a user agreed to the terms
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS agreed_to_terms BOOLEAN DEFAULT FALSE;

-- Ensure existing rows have a deterministic value
UPDATE public.users
SET agreed_to_terms = COALESCE(agreed_to_terms, FALSE);
