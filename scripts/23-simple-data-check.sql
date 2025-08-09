-- Simple data check for swipe functionality
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID

SELECT 
    'Total posts' as metric,
    COUNT(*) as count
FROM posts

UNION ALL

SELECT 
    'Posts by others' as metric,
    COUNT(*) as count
FROM posts 
WHERE user_id != 'YOUR_USER_ID_HERE'

UNION ALL

SELECT 
    'Posts you voted on' as metric,
    COUNT(*) as count
FROM votes 
WHERE user_id = 'YOUR_USER_ID_HERE'

UNION ALL

SELECT 
    'Posts available for swipe' as metric,
    COUNT(*) as count
FROM posts p
WHERE p.user_id != 'YOUR_USER_ID_HERE'
AND p.id NOT IN (
    SELECT post_id 
    FROM votes 
    WHERE user_id = 'YOUR_USER_ID_HERE'
);
