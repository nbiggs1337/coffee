-- Diagnostic script to check swipe data availability
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID

DO $$
DECLARE
    target_user_id TEXT := 'YOUR_USER_ID_HERE';
    total_posts INTEGER;
    own_posts INTEGER;
    other_posts INTEGER;
    voted_posts INTEGER;
    available_posts INTEGER;
BEGIN
    -- Count total posts
    SELECT COUNT(*) INTO total_posts FROM posts;
    RAISE NOTICE 'Total posts in database: %', total_posts;
    
    -- Count user's own posts
    SELECT COUNT(*) INTO own_posts FROM posts WHERE user_id = target_user_id;
    RAISE NOTICE 'Posts created by user: %', own_posts;
    
    -- Count posts by other users
    SELECT COUNT(*) INTO other_posts FROM posts WHERE user_id != target_user_id;
    RAISE NOTICE 'Posts by other users: %', other_posts;
    
    -- Count posts user has voted on
    SELECT COUNT(*) INTO voted_posts FROM votes WHERE user_id = target_user_id;
    RAISE NOTICE 'Posts user has voted on: %', voted_posts;
    
    -- Count posts available for swipe
    SELECT COUNT(*) INTO available_posts 
    FROM posts p 
    WHERE p.user_id != target_user_id 
    AND p.id NOT IN (SELECT post_id FROM votes WHERE user_id = target_user_id);
    
    RAISE NOTICE 'Posts available for swipe: %', available_posts;
END $$;
