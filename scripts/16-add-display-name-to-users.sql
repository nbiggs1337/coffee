-- Add display_name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing users to have a display_name based on their full_name
UPDATE users 
SET display_name = full_name 
WHERE display_name IS NULL AND full_name IS NOT NULL;

-- Create index for display_name for better search performance
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
