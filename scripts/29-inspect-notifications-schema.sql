-- This script helps diagnose the structure of your 'notifications' table.
-- It is read-only and does not make any changes.

-- Query 1: Inspect the column names and data types.
-- This will show us the exact names of all columns in the table.
SELECT
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'notifications'
ORDER BY
    ordinal_position;

-- Query 2: Show a sample of 10 recent notifications.
-- This helps us see what data is actually being stored in the columns,
-- especially to check which column holds the post ID.
SELECT
    *
FROM
    public.notifications
ORDER BY
    created_at DESC
LIMIT 10;
