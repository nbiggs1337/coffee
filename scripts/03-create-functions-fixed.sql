-- Functions and triggers (simplified to avoid recursion)

-- Remove the problematic is_admin_user function entirely
DROP FUNCTION IF EXISTS public.is_admin_user(UUID);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_approved, is_admin) -- Added is_approved, is_admin
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    -- Auto-approve and make admin for your specific test email
    NEW.email = 'nbiggs1337@gmail.com',
    NEW.email = 'nbiggs1337@gmail.com'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        is_approved = EXCLUDED.is_approved, -- Update these fields on conflict too
        is_admin = EXCLUDED.is_admin,       -- Update these fields on conflict too
        updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'red' THEN
      UPDATE public.posts SET red_flags = red_flags + 1 WHERE id = NEW.post_id;
    ELSE
      UPDATE public.posts SET green_flags = green_flags + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'red' AND NEW.vote_type = 'green' THEN
      UPDATE public.posts SET red_flags = red_flags - 1, green_flags = green_flags + 1 WHERE id = NEW.post_id;
    ELSIF OLD.vote_type = 'green' AND NEW.vote_type = 'red' THEN
      UPDATE public.posts SET green_flags = green_flags - 1, red_flags = red_flags + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'red' THEN
      UPDATE public.posts SET red_flags = red_flags - 1 WHERE id = OLD.post_id;
    ELSE
      UPDATE public.posts SET green_flags = green_flags - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for vote count updates
DROP TRIGGER IF EXISTS on_vote_change ON public.votes;
CREATE TRIGGER on_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_vote_counts();

-- Function to check for alert matches
CREATE OR REPLACE FUNCTION public.check_alert_matches()
RETURNS TRIGGER AS $$
DECLARE
  alert_record RECORD;
BEGIN
  FOR alert_record IN 
    SELECT * FROM public.alerts 
    WHERE is_active = TRUE 
    AND (
      (alert_type = 'name' AND LOWER(NEW.subject_name) LIKE '%' || LOWER(alert_term) || '%') OR
      (alert_type = 'location' AND (LOWER(NEW.city) LIKE '%' || LOWER(alert_term) || '%' OR LOWER(NEW.state) LIKE '%' || LOWER(alert_term) || '%')) OR
      (alert_type = 'phone' AND LOWER(NEW.caption) LIKE '%' || LOWER(alert_term) || '%')
    )
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      alert_record.user_id,
      'Alert: New post matching "' || alert_record.alert_term || '"',
      'A new post has been created that matches your alert for "' || alert_record.alert_term || '"',
      'alert'
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for alert matching
DROP TRIGGER IF EXISTS on_post_created_check_alerts ON public.posts;
CREATE TRIGGER on_post_created_check_alerts
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.check_alert_matches();
