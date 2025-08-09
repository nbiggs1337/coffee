-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user approval" ON public.users;

DROP POLICY IF EXISTS "Approved users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Approved users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

DROP POLICY IF EXISTS "Approved users can view comments" ON public.comments;
DROP POLICY IF EXISTS "Approved users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

DROP POLICY IF EXISTS "Approved users can view votes" ON public.votes;
DROP POLICY IF EXISTS "Approved users can create votes" ON public.votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;

DROP POLICY IF EXISTS "Users can manage their own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- USERS table policies (simplified to avoid recursion)
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Simple admin policies that don't cause recursion
-- We'll handle admin checks in the application layer instead
CREATE POLICY "Allow service role full access to users" ON public.users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- POSTS table policies
CREATE POLICY "Approved users can view all posts" ON public.posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

CREATE POLICY "Approved users can create posts" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS table policies
CREATE POLICY "Approved users can view comments" ON public.comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

CREATE POLICY "Approved users can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- VOTES table policies
CREATE POLICY "Approved users can view votes" ON public.votes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

CREATE POLICY "Approved users can create votes" ON public.votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

CREATE POLICY "Users can update their own votes" ON public.votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.votes
  FOR DELETE USING (auth.uid() = user_id);

-- ALERTS table policies
CREATE POLICY "Users can manage their own alerts" ON public.alerts
  FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS table policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
