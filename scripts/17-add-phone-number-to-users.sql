-- Add phone_number column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phone_number') THEN
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
        
        -- Create index for phone number searches
        CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);
        
        -- Update RLS policies to include phone_number in selectable columns
        -- (The existing policies should already cover this, but let's be explicit)
        
        COMMENT ON COLUMN public.users.phone_number IS 'User phone number for contact and verification';
        
        -- Update RLS policies to include phone_number
        DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
        CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);
        
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;
