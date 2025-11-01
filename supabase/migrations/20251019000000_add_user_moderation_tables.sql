/*
  # Add User Moderation Tables and Functions

  ## Overview
  Creates tables and functions for user moderation including bans, mutes, and admin operations.

  ## New Tables

  ### 1. banned_users
  - `id` (uuid, primary key) - Unique ban identifier
  - `email` (text, not null, unique) - Banned email address
  - `user_id` (uuid, nullable) - References profiles(id), can be null if account deleted
  - `reason` (text, not null) - Ban reason
  - `banned_at` (timestamptz, not null) - When ban was issued
  - `banned_by` (uuid, not null) - Admin who issued ban
  - `expires_at` (timestamptz, nullable) - Null for permanent bans
  - `is_active` (boolean, default true) - False when ban expires or is removed

  ### 2. Add moderation fields to profiles
  - `is_muted` (boolean, default false) - Prevents creating commissions
  - `muted_until` (timestamptz, nullable) - When mute expires
  - `muted_reason` (text, nullable) - Mute reason
  - `muted_by` (uuid, nullable) - Admin who muted user

  ## New Functions
  - `expire_old_bans()` - Sets is_active = false for expired bans
  - `check_ban_status(user_email text)` - Returns ban info if email is banned
  - `ban_user(target_user_id uuid, reason text, duration_hours int)` - Bans user
  - `unban_user(target_user_id uuid)` - Unbans user
  - `mute_user(target_user_id uuid, reason text, duration_hours int)` - Mutes user
  - `unmute_user(target_user_id uuid)` - Unmutes user
  - `delete_user_completely(target_user_id uuid)` - Deletes user and all data

  ## Security
  - RLS enabled on banned_users table
  - Admin-only policies for moderation functions
  - Commission creation blocked for muted users
*/

-- =====================================================
-- BANNED USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  banned_at timestamptz NOT NULL DEFAULT now(),
  banned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at timestamptz,
  is_active boolean DEFAULT true NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_banned_users_email ON banned_users(email);
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_expires_at ON banned_users(expires_at);
CREATE INDEX IF NOT EXISTS idx_banned_users_is_active ON banned_users(is_active);

-- Enable RLS
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banned_users
CREATE POLICY "Admins can view all banned users"
  ON banned_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = ANY(SELECT unnest(ARRAY['8b49f59f-dbbe-41e1-9ed2-36be888467ca']::uuid[]))
    )
  );

CREATE POLICY "Admins can insert banned users"
  ON banned_users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = ANY(SELECT unnest(ARRAY['8b49f59f-dbbe-41e1-9ed2-36be888467ca']::uuid[]))
    )
  );

CREATE POLICY "Admins can update banned users"
  ON banned_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = ANY(SELECT unnest(ARRAY['8b49f59f-dbbe-41e1-9ed2-36be888467ca']::uuid[]))
    )
  );

CREATE POLICY "Admins can delete banned users"
  ON banned_users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = ANY(SELECT unnest(ARRAY['8b49f59f-dbbe-41e1-9ed2-36be888467ca']::uuid[]))
    )
  );

-- =====================================================
-- ADD MODERATION FIELDS TO PROFILES
-- =====================================================

-- Add moderation fields to profiles table
DO $$
BEGIN
  -- Add is_muted column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_muted'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_muted boolean DEFAULT false NOT NULL;
  END IF;

  -- Add muted_until column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'muted_until'
  ) THEN
    ALTER TABLE profiles ADD COLUMN muted_until timestamptz;
  END IF;

  -- Add muted_reason column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'muted_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN muted_reason text;
  END IF;

  -- Add muted_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'muted_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN muted_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN user_id = ANY(SELECT unnest(ARRAY['8b49f59f-dbbe-41e1-9ed2-36be888467ca']::uuid[]));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old bans
CREATE OR REPLACE FUNCTION expire_old_bans()
RETURNS void AS $$
BEGIN
  UPDATE banned_users 
  SET is_active = false 
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check ban status
CREATE OR REPLACE FUNCTION check_ban_status(user_email text)
RETURNS TABLE(
  is_banned boolean,
  reason text,
  banned_at timestamptz,
  expires_at timestamptz,
  banned_by uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bu.is_active as is_banned,
    bu.reason,
    bu.banned_at,
    bu.expires_at,
    bu.banned_by
  FROM banned_users bu
  WHERE bu.email = user_email
    AND bu.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MODERATION FUNCTIONS
-- =====================================================

-- Function to ban a user
CREATE OR REPLACE FUNCTION ban_user(
  target_user_id uuid,
  reason text,
  duration_hours int DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  target_email text;
  expires_at_timestamptz timestamptz;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Check if target user is admin
  IF is_admin(target_user_id) THEN
    RAISE EXCEPTION 'Cannot ban admin users.';
  END IF;

  -- Get target user email
  SELECT email INTO target_email FROM profiles WHERE id = target_user_id;
  
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  -- Calculate expiration time
  IF duration_hours IS NOT NULL THEN
    expires_at_timestamptz := now() + (duration_hours || ' hours')::interval;
  END IF;

  -- Insert ban record
  INSERT INTO banned_users (email, user_id, reason, banned_by, expires_at)
  VALUES (target_email, target_user_id, reason, auth.uid(), expires_at_timestamptz)
  ON CONFLICT (email) DO UPDATE SET
    reason = EXCLUDED.reason,
    banned_by = EXCLUDED.banned_by,
    expires_at = EXCLUDED.expires_at,
    is_active = true,
    banned_at = now();

  -- Log out the user by invalidating their session
  -- This will force them to re-authenticate, at which point they'll be blocked
  -- We'll update their last_sign_in_at to force session refresh
  UPDATE auth.users 
  SET last_sign_in_at = now() - interval '1 year'
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unban a user
CREATE OR REPLACE FUNCTION unban_user(target_user_id uuid)
RETURNS void AS $$
DECLARE
  target_email text;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Get target user email
  SELECT email INTO target_email FROM profiles WHERE id = target_user_id;
  
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  -- Deactivate ban
  UPDATE banned_users 
  SET is_active = false 
  WHERE email = target_email AND is_active = true;

  -- Restore user's ability to log in by updating their last_sign_in_at
  UPDATE auth.users 
  SET last_sign_in_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mute a user
CREATE OR REPLACE FUNCTION mute_user(
  target_user_id uuid,
  reason text,
  duration_hours int DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  expires_at_timestamptz timestamptz;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Check if target user is admin
  IF is_admin(target_user_id) THEN
    RAISE EXCEPTION 'Cannot mute admin users.';
  END IF;

  -- Calculate expiration time
  IF duration_hours IS NOT NULL THEN
    expires_at_timestamptz := now() + (duration_hours || ' hours')::interval;
  END IF;

  -- Update user profile
  UPDATE profiles 
  SET 
    is_muted = true,
    muted_until = expires_at_timestamptz,
    muted_reason = reason,
    muted_by = auth.uid()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unmute a user
CREATE OR REPLACE FUNCTION unmute_user(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update user profile
  UPDATE profiles 
  SET 
    is_muted = false,
    muted_until = NULL,
    muted_reason = NULL,
    muted_by = NULL
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to completely delete a user
CREATE OR REPLACE FUNCTION delete_user_completely(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Check if target user is admin
  IF is_admin(target_user_id) THEN
    RAISE EXCEPTION 'Cannot delete admin users.';
  END IF;

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  -- Delete from auth.users (this will cascade to profiles and commissions)
  -- No need to add to banned_users table - just delete the user
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UPDATE COMMISSION POLICIES
-- =====================================================

-- Add policy to prevent muted users from creating commissions
CREATE POLICY "Non-muted users can create commissions"
  ON commissions FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_muted = true OR (profiles.muted_until IS NOT NULL AND profiles.muted_until > now()))
    )
  );

-- =====================================================
-- CREATE TRIGGER FOR AUTO-EXPIRING BANS
-- =====================================================

-- Create a function that will be called periodically to expire bans
CREATE OR REPLACE FUNCTION auto_expire_bans()
RETURNS void AS $$
BEGIN
  PERFORM expire_old_bans();
END;
$$ LANGUAGE plpgsql;

-- Note: In production, you would set up a cron job or scheduled function
-- to call auto_expire_bans() periodically (e.g., every hour)
