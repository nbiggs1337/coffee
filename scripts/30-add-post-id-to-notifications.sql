-- Step 1: Add the column to store the post ID in notifications.
-- This script is safe to run multiple times.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'related_post_id'
    ) THEN
        ALTER TABLE public.notifications
        ADD COLUMN related_post_id UUID;
    END IF;
END $$;

-- Step 2: Add a foreign key constraint to ensure data integrity.
-- This links the notification to the actual post.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'notifications_related_post_id_fkey'
    ) THEN
        ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_related_post_id_fkey
        FOREIGN KEY (related_post_id)
        REFERENCES public.posts(id)
        ON DELETE SET NULL; -- If a post is deleted, just nullify the link, don't delete the notification.
    END IF;
END $$;
