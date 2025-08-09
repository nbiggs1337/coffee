-- Drop the existing view first to avoid column reordering/renaming conflicts
DROP VIEW IF EXISTS public.posts_with_comment_count;

-- Create the view with explicit column selection and correct order
CREATE OR REPLACE VIEW public.posts_with_comment_count AS
SELECT
    p.id,
    p.user_id,
    p.subject_name,
    p.subject_age,
    p.city,
    p.state,
    p.phone_number, -- Explicitly include phone_number
    p.caption,
    p.photos,
    p.red_flags,
    p.green_flags,
    p.created_at,
    p.updated_at,
    (SELECT count(*)::int FROM public.comments c WHERE c.post_id = p.id) AS comment_count
FROM
    public.posts p;

-- Grant select permissions on the new view to authenticated users
GRANT SELECT ON public.posts_with_comment_count TO authenticated;
