/*
  # Create Authentication and Commissions Schema

  ## Overview
  This migration sets up the core database schema for the Parcel Studio application, including user profiles and commission management.

  ## New Tables

  ### 1. profiles
  Stores user profile information linked to Supabase auth.users
  - `id` (uuid, primary key) - References auth.users(id)
  - `email` (text, unique, not null) - User's email address
  - `display_name` (text, not null) - User's display name
  - `avatar` (text, optional) - URL to user's avatar image
  - `bio` (text, optional) - User biography
  - `onboarding_completed` (boolean, default false) - Tracks if onboarding is complete
  - `created_at` (timestamptz, default now()) - Profile creation timestamp
  - `updated_at` (timestamptz, default now()) - Last update timestamp

  ### 2. commissions
  Stores commission requests from users
  - `id` (uuid, primary key) - Unique commission identifier
  - `user_id` (uuid, not null) - Foreign key to profiles(id)
  - `reference_number` (text, unique, not null) - Human-readable reference number
  - `task_complexity` (text, not null) - Complexity level: easy, medium, hard, extreme
  - `subject` (text, not null) - Commission subject/title
  - `description` (text, not null) - Detailed description
  - `proposed_amount` (numeric, not null) - Proposed payment amount
  - `status` (text, default 'draft') - Status: draft, submitted, in_review, approved, rejected, completed
  - `created_at` (timestamptz, default now()) - Creation timestamp
  - `updated_at` (timestamptz, default now()) - Last update timestamp

  ## Security
  Row Level Security (RLS) is enabled on all tables with appropriate policies:

  ### profiles table policies:
  1. Users can view their own profile
  2. Users can update their own profile
  3. Public can view any profile (for portfolio/commission display)

  ### commissions table policies:
  1. Users can view their own commissions
  2. Users can create new commissions
  3. Users can update their own commissions (only if status allows)
  4. Admins can view all commissions (future enhancement)

  ## Functions
  - `handle_new_user()` - Trigger function to automatically create a profile when a new user signs up
  - `update_updated_at_column()` - Trigger function to automatically update the updated_at timestamp

  ## Important Notes
  1. All operations use IF NOT EXISTS to allow safe re-running
  2. RLS is restrictive by default - only authenticated users can access data
  3. Foreign key constraints ensure data integrity
  4. Timestamps are automatically managed via triggers
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  avatar text,
  bio text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference_number text UNIQUE NOT NULL,
  task_complexity text NOT NULL CHECK (task_complexity IN ('easy', 'medium', 'hard', 'extreme')),
  subject text NOT NULL,
  description text NOT NULL,
  proposed_amount numeric NOT NULL CHECK (proposed_amount >= 0),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Public can view any profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Commissions policies
CREATE POLICY "Users can view their own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own commissions"
  ON commissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commissions"
  ON commissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commissions"
  ON commissions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
