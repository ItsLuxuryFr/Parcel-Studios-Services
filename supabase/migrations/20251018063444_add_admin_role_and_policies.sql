/*
  # Add Admin Role and Update RLS Policies

  ## Changes Made

  1. **Schema Changes**
     - Add `is_admin` boolean column to profiles table (default: false)
     - This field identifies users with administrative privileges

  2. **RLS Policy Updates**
     - Add policy for admins to view all commissions
     - Add policy for admins to update all commissions
     - Keep existing policies for regular users unchanged

  ## Security Notes

  - Admin status is stored in the profiles table
  - Admins can view and update any commission regardless of owner
  - Regular users can only see their own commissions
  - Admin status cannot be self-assigned (would require direct database access)
*/

-- Add is_admin column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Add RLS policy for admins to view all commissions
DROP POLICY IF EXISTS "Admins can view all commissions" ON commissions;
CREATE POLICY "Admins can view all commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Add RLS policy for admins to update all commissions
DROP POLICY IF EXISTS "Admins can update all commissions" ON commissions;
CREATE POLICY "Admins can update all commissions"
  ON commissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );