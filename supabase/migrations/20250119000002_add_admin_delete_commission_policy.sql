/*
  # Add Admin Delete Policy for Commissions

  ## Issue
  Admins cannot delete commissions in the admin panel because there's no RLS policy 
  allowing admins to delete commissions. The existing policy only allows users to 
  delete their own commissions.

  ## Solution
  Add a new RLS policy that allows admins to delete any commission.
*/

-- Add RLS policy for admins to delete all commissions
CREATE POLICY "Admins can delete all commissions"
  ON commissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
