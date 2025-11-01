/*
  # Set Admin Status for Admin User

  ## Issue
  The admin user has admin privileges defined in the admin list, but the RLS policies
  are checking the `is_admin` column in the profiles table. This mismatch prevents
  the admin from accessing all commissions.

  ## Solution
  Update the admin user's profile to set `is_admin = true` so the RLS policies work correctly.
*/

-- Set the admin user's is_admin status to true
UPDATE profiles 
SET is_admin = true 
WHERE id = '8b49f59f-dbbe-41e1-9ed2-36be888467ca';

-- Verify the update
SELECT id, email, display_name, is_admin 
FROM profiles 
WHERE id = '8b49f59f-dbbe-41e1-9ed2-36be888467ca';
