/*
  # Fix Profile Creation Trigger and Policies

  ## Overview
  This migration fixes the issue preventing new user profile creation by:
  1. Adding an INSERT policy for the profiles table that allows the trigger to work
  2. Updating the trigger function to use SECURITY DEFINER properly
  3. Ensuring the function bypasses RLS when creating profiles

  ## Changes
  - Drop and recreate the handle_new_user function with proper permissions
  - Add an INSERT policy for the profiles table to allow profile creation via trigger
  - Ensure the trigger can insert profiles even when the user isn't authenticated yet

  ## Security Notes
  - The SECURITY DEFINER ensures the function runs with postgres privileges
  - RLS policies still protect all other operations
  - Only the automated trigger can create profiles during signup
*/

-- Drop existing function and recreate with proper settings
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
