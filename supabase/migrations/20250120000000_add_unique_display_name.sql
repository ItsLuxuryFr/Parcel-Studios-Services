-- Add unique constraint to display_name in profiles table
-- This ensures display names are unique across all users

-- First, handle any existing duplicate display names by making them unique
UPDATE profiles 
SET display_name = display_name || '_' || substring(id::text, 1, 8)
WHERE display_name IN (
  SELECT display_name 
  FROM profiles 
  WHERE display_name != '' AND display_name IS NOT NULL
  GROUP BY display_name 
  HAVING COUNT(*) > 1
);

-- Add unique constraint to display_name
ALTER TABLE profiles 
ADD CONSTRAINT unique_display_name UNIQUE (display_name);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles (display_name);
