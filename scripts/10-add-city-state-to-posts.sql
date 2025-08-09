-- Add city and state columns to the posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS state TEXT;

-- Attempt to migrate existing 'location' data into 'city' and 'state'
-- This assumes your existing 'location' data is in a "City, StateCode" format.
-- For example, 'New York, NY' will be split into city='New York' and state='NY'.
-- If your data format is different, you might need to adjust this UPDATE statement.
UPDATE public.posts
SET
    city = TRIM(SPLIT_PART(location, ',', 1)),
    state = TRIM(SPLIT_PART(location, ',', 2))
WHERE
    location IS NOT NULL AND location LIKE '%,%';

-- Remove the old 'location' column after migration
ALTER TABLE public.posts DROP COLUMN IF EXISTS location;
