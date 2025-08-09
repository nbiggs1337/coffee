-- Recreate policies idempotently (drop if exists, then create)

-- USERS
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Updated policy to use is_admin_user function
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    public.is_admin_user(auth.uid())
  );

-- Updated policy to use is_admin_user function
DROP POLICY IF EXISTS "Admins can update user approval" ON public.users;
CREATE POLICY "Admins can update user approval" ON public.users
  FOR UPDATE USING (
    public.is_admin_user(auth.uid())
  ) WITH CHECK (
    public.is_admin_user(auth.uid())
  );

-- POSTS
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

-- COMMENTS
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

-- VOTES
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

-- ALERTS
DROP POLICY IF EXISTS "Users can manage their own alerts" ON public.alerts;
CREATE POLICY "Users can manage their own alerts" ON public.alerts
  FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
