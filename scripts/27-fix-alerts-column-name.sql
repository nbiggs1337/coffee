-- This script corrects the column name from 'alert_value' to 'alert_term'.
-- It is safe to run multiple times and does not use the RAISE keyword.

-- Step 1: Check if the incorrect 'alert_value' column exists and rename it.
DO $$
BEGIN
    -- Check if the column 'alert_value' exists in the 'alerts' table.
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'alerts'
        AND column_name = 'alert_value'
    ) THEN
        -- If it exists, rename it to 'alert_term'.
        ALTER TABLE public.alerts RENAME COLUMN alert_value TO alert_term;
    END IF;

    -- After potentially renaming, check if 'alert_term' exists.
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'alerts'
        AND column_name = 'alert_term'
    ) THEN
        -- If it does not exist, add it.
        ALTER TABLE public.alerts ADD COLUMN alert_term TEXT NOT NULL;
    END IF;
END;
$$;

-- Step 2: Ensure the column is not nullable. This is the constraint that was failing.
-- This command will fail if there are existing rows with NULL in this column, but it's necessary for new inserts.
ALTER TABLE public.alerts ALTER COLUMN alert_term SET NOT NULL;
