/*
  # Fix profiles table INSERT policy

  ## Changes
  1. Add INSERT policy for the service role to allow the trigger to create profiles
  
  ## Security
  - The policy allows inserts only for the service role (used by triggers)
  - Users cannot directly insert into profiles table
  - Profiles are only created via the authentication trigger
*/

-- Add INSERT policy for service role (used by triggers)
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);