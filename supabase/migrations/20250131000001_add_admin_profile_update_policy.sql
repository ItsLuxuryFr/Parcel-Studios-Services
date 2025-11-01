-- Add RLS policy for admins to update any profile
-- This allows admins to edit user profiles including display name, avatar, and bio
-- Note: This policy works alongside "Users can update their own profile" policy
-- PostgreSQL RLS uses OR logic between policies

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    -- Allow users to update their own profile OR admins to update any profile
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    -- Same check for WITH CHECK clause
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

