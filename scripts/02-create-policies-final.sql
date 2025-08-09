-- Final policy fix - ensure users can read their own data after login

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow service role full access to users" ON public.users;
DROP POLICY IF EXISTS "Allow user creation via trigger" ON public.users;

-- USERS table policies - more permissive for authenticated users
CREATE POLICY "Authenticated users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role (used by server actions) full access
CREATE POLICY "Service role full access to users" ON public.users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Also allow the trigger function to insert new users
CREATE POLICY "Allow user creation via trigger" ON public.users
  FOR INSERT WITH CHECK (true);

-- POSTS table policies
DROP POLICY IF EXISTS "Approved users can view all posts" ON public.posts;
CREATE POLICY "Approved users can view all posts" ON public.posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

DROP POLICY IF EXISTS "Approved users can create posts" ON public.posts;
CREATE POLICY "Approved users can create posts" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS table policies
DROP POLICY IF EXISTS "Approved users can view comments" ON public.comments;
CREATE POLICY "Approved users can view comments" ON public.comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

DROP POLICY IF EXISTS "Approved users can create comments" ON public.comments;
CREATE POLICY "Approved users can create comments" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- VOTES table policies
DROP POLICY IF EXISTS "Approved users can view votes" ON public.votes;
CREATE POLICY "Approved users can view votes" ON public.votes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

DROP POLICY IF EXISTS "Approved users can create votes" ON public.votes;
CREATE POLICY "Approved users can create votes" ON public.votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_approved = TRUE)
  );

DROP POLICY IF EXISTS "Users can update their own votes" ON public.votes;
CREATE POLICY "Users can update their own votes" ON public.votes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;
CREATE POLICY "Users can delete their own votes" ON public.votes
  FOR DELETE USING (auth.uid() = user_id);

-- ALERTS table policies
DROP POLICY IF EXISTS "Users can manage their own alerts" ON public.alerts;
CREATE POLICY "Users can manage their own alerts" ON public.alerts
  FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS table policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
