-- This script ensures the 'alerts' table has the correct columns.
-- It's safe to run even if the columns already exist.

-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add 'alert_type' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='alerts' AND column_name='alert_type') THEN
        ALTER TABLE public.alerts ADD COLUMN alert_type TEXT NOT NULL CHECK (alert_type IN ('name', 'location', 'phone'));
    END IF;
END $$;

-- Add 'alert_value' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='alerts' AND column_name='alert_value') THEN
        ALTER TABLE public.alerts ADD COLUMN alert_value TEXT;
    END IF;
END $$;

-- Make 'alert_value' NOT NULL after adding it, to avoid issues with existing rows
ALTER TABLE public.alerts ALTER COLUMN alert_value SET NOT NULL;


-- Add 'updated_at' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='alerts' AND column_name='updated_at') THEN
        ALTER TABLE public.alerts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Ensure the RLS policies and trigger function are up-to-date.
-- Re-running these is safe.

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.alerts;
CREATE POLICY "Users can view their own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own alerts" ON public.alerts;
CREATE POLICY "Users can create their own alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.alerts;
CREATE POLICY "Users can delete their own alerts" ON public.alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.alerts TO authenticated;
