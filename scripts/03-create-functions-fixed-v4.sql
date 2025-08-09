-- This function runs on every new post to check for matching alerts.
-- We are updating it to use the correct 'subject_name' column.
CREATE OR REPLACE FUNCTION public.check_alert_matches()
RETURNS TRIGGER AS $$
DECLARE
    alert RECORD;
    alert_title TEXT;
    alert_message TEXT;
BEGIN
    -- Loop through all alerts in the system
    FOR alert IN SELECT * FROM public.alerts
    LOOP
        -- Check for a match based on the alert type, using the correct column name 'subject_name'
        IF (alert.alert_type = 'name' AND NEW.subject_name ILIKE '%' || alert.alert_term || '%') OR
           (alert.alert_type = 'location' AND (NEW.city ILIKE '%' || alert.alert_term || '%' OR NEW.state ILIKE '%' || alert.alert_term || '%')) OR
           (alert.alert_type = 'phone' AND NEW.phone_number ILIKE '%' || alert.alert_term || '%')
        THEN
            -- A match is found, create a notification for the user who set the alert
            alert_title := 'Alert: New post matching "' || alert.alert_term || '"';
            alert_message := 'A new post has been created that matches your alert for "' || alert.alert_term || '"';

            INSERT INTO public.notifications (user_id, title, message, type, related_post_id)
            VALUES (alert.user_id, alert_title, alert_message, 'alert', NEW.id); -- Include the new post's ID
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists and is linked to the function
DROP TRIGGER IF EXISTS on_new_post_check_alerts ON public.posts;
CREATE TRIGGER on_new_post_check_alerts
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.check_alert_matches();
