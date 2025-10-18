/*
  # Fix Profile Creation - Add INSERT Policy

  1. Changes
    - Add INSERT policy for profiles table to allow profile creation during signup
    - The trigger function runs with SECURITY DEFINER but still needs INSERT permission

  2. Security
    - Policy ensures only authenticated users can insert their own profile
    - Uses auth.uid() to match the profile ID being inserted
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);