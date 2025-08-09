-- Temporarily disable RLS on users table to get the app working
-- We'll re-enable it once we confirm everything else works

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on other tables but make them more permissive
DROP POLICY IF EXISTS "Approved users can view all posts" ON public.posts;
CREATE POLICY "Authenticated users can view all posts" ON public.posts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Approved users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Approved users can view comments" ON public.comments;
CREATE POLICY "Authenticated users can view comments" ON public.comments
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Approved users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Approved users can view votes" ON public.votes;
CREATE POLICY "Authenticated users can view votes" ON public.votes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Approved users can create votes" ON public.votes;
CREATE POLICY "Authenticated users can create votes" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
