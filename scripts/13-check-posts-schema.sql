-- Check the actual structure of the posts table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show a sample post to understand the data structure
SELECT * FROM posts LIMIT 1;

-- Show all table names that contain 'post' to understand the schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%post%';
