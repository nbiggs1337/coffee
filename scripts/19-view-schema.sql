-- This script provides a detailed view of the relevant tables
-- to ensure the application code matches the database schema exactly.

-- View columns for the 'posts' table
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'posts'
ORDER BY
    ordinal_position;

-- View columns for the 'app_users' table
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'app_users'
ORDER BY
    ordinal_position;

-- View columns for the 'votes' table
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'votes'
ORDER BY
    ordinal_position;
