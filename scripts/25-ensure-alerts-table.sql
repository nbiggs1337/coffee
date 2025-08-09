-- Create alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('name', 'location', 'phone')),
    alert_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type_value ON alerts(alert_type, alert_value);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Enable RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own alerts" ON alerts;
CREATE POLICY "Users can view their own alerts" ON alerts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own alerts" ON alerts;
CREATE POLICY "Users can create their own alerts" ON alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own alerts" ON alerts;
CREATE POLICY "Users can delete their own alerts" ON alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Function to check if a post matches any alerts
CREATE OR REPLACE FUNCTION check_alert_matches()
RETURNS TRIGGER AS $$
BEGIN
    -- Check name alerts (against user's display_name and full_name)
    INSERT INTO notifications (user_id, type, title, message, related_post_id)
    SELECT DISTINCT 
        a.user_id,
        'alert_match',
        'Alert Match: Name',
        'A post mentions "' || a.alert_value || '" - check it out!',
        NEW.id
    FROM alerts a
    JOIN users u ON NEW.user_id = u.id
    WHERE a.alert_type = 'name'
    AND a.user_id != NEW.user_id -- Don't notify about own posts
    AND (
        LOWER(u.display_name) LIKE '%' || a.alert_value || '%'
        OR LOWER(u.full_name) LIKE '%' || a.alert_value || '%'
        OR LOWER(NEW.content) LIKE '%' || a.alert_value || '%'
    );

    -- Check location alerts
    INSERT INTO notifications (user_id, type, title, message, related_post_id)
    SELECT DISTINCT 
        a.user_id,
        'alert_match',
        'Alert Match: Location',
        'A post from "' || a.alert_value || '" was posted - check it out!',
        NEW.id
    FROM alerts a
    WHERE a.alert_type = 'location'
    AND a.user_id != NEW.user_id -- Don't notify about own posts
    AND (
        LOWER(NEW.city) LIKE '%' || a.alert_value || '%'
        OR LOWER(NEW.state) LIKE '%' || a.alert_value || '%'
        OR LOWER(COALESCE(NEW.city, '') || ' ' || COALESCE(NEW.state, '')) LIKE '%' || a.alert_value || '%'
    );

    -- Check phone alerts
    INSERT INTO notifications (user_id, type, title, message, related_post_id)
    SELECT DISTINCT 
        a.user_id,
        'alert_match',
        'Alert Match: Phone',
        'A post with phone number "' || a.alert_value || '" was posted - check it out!',
        NEW.id
    FROM alerts a
    WHERE a.alert_type = 'phone'
    AND a.user_id != NEW.user_id -- Don't notify about own posts
    AND NEW.phone_number LIKE '%' || a.alert_value || '%';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check alerts when posts are created
DROP TRIGGER IF EXISTS trigger_check_alert_matches ON posts;
CREATE TRIGGER trigger_check_alert_matches
    AFTER INSERT ON posts
    FOR EACH ROW
    EXECUTE FUNCTION check_alert_matches();

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON alerts TO authenticated;
GRANT USAGE ON SEQUENCE alerts_id_seq TO authenticated;
