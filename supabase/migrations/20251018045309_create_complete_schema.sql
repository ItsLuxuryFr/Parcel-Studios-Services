/*
  # Complete Commission Platform Database Schema

  This migration creates the complete database schema for a commission art platform.

  ## Tables Created

  1. **profiles**
     - `id` (uuid, primary key) - References auth.users
     - `email` (text, not null) - User's email
     - `display_name` (text) - User's display name
     - `avatar` (text) - URL to user's avatar image
     - `bio` (text) - User biography
     - `onboarding_completed` (boolean, default false) - Onboarding status
     - `created_at` (timestamptz, default now()) - Account creation timestamp
     - `updated_at` (timestamptz, default now()) - Last update timestamp

  2. **commissions**
     - `id` (uuid, primary key) - Unique commission ID
     - `user_id` (uuid, not null) - References profiles(id)
     - `task_complexity` (text, not null) - One of: easy, medium, hard, extreme
     - `subject` (text, not null) - Commission subject/title
     - `description` (text, not null) - Detailed description
     - `proposed_amount` (numeric, not null) - Proposed payment amount
     - `status` (text, default 'draft') - One of: draft, submitted, in_review, approved, rejected, completed
     - `reference_number` (text, unique, not null) - Auto-generated reference (e.g., COM-2025-001)
     - `created_at` (timestamptz, default now()) - Creation timestamp
     - `updated_at` (timestamptz, default now()) - Last update timestamp

  3. **portfolio_projects**
     - `id` (uuid, primary key) - Unique project ID
     - `category` (text, not null) - One of: scripting, vfx, building, uiux
     - `title` (text, not null) - Project title
     - `short_caption` (text, not null) - Brief description
     - `description` (text, not null) - Full project description
     - `thumbnail_url` (text, not null) - Main thumbnail image URL
     - `video_url` (text) - Optional video URL
     - `images` (text[], default '{}') - Array of image URLs
     - `tags` (text[], default '{}') - Array of tags
     - `skills` (text[], default '{}') - Array of skills used
     - `completion_date` (text, not null) - Completion date (YYYY-MM format)
     - `featured` (boolean, default false) - Whether project is featured
     - `created_at` (timestamptz, default now()) - Creation timestamp

  ## Security (RLS)

  - All tables have Row Level Security enabled
  - Profiles: Users can view all profiles, but only update their own
  - Commissions: Users can only view and manage their own commissions
  - Portfolio projects: Public read access, admin-only write access

  ## Triggers

  - Automatic profile creation when a new user signs up
  - Auto-update timestamps on record updates
  - Auto-generate commission reference numbers

  ## Notes

  - Uses restrictive RLS policies by default
  - All foreign keys have proper constraints
  - Indexed columns for performance
  - Data integrity enforced through check constraints
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text DEFAULT '',
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
  task_complexity text NOT NULL CHECK (task_complexity IN ('easy', 'medium', 'hard', 'extreme')),
  subject text NOT NULL,
  description text NOT NULL,
  proposed_amount numeric NOT NULL CHECK (proposed_amount >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'completed')),
  reference_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create portfolio_projects table
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('scripting', 'vfx', 'building', 'uiux')),
  title text NOT NULL,
  short_caption text NOT NULL,
  description text NOT NULL,
  thumbnail_url text NOT NULL,
  video_url text,
  images text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  skills text[] DEFAULT '{}',
  completion_date text NOT NULL,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_category ON portfolio_projects(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_featured ON portfolio_projects(featured);

-- Create function to generate commission reference numbers
CREATE OR REPLACE FUNCTION generate_commission_reference()
RETURNS text AS $$
DECLARE
  year text;
  seq_num text;
  max_num integer;
BEGIN
  year := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(
      substring(reference_number from 'COM-' || year || '-(.*)') AS integer
    )
  ), 0) INTO max_num
  FROM commissions
  WHERE reference_number LIKE 'COM-' || year || '-%';
  
  seq_num := LPAD((max_num + 1)::text, 3, '0');
  
  RETURN 'COM-' || year || '-' || seq_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate reference numbers for new commissions
CREATE OR REPLACE FUNCTION set_commission_reference()
RETURNS trigger AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_commission_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_commission_reference ON commissions;
CREATE TRIGGER trigger_set_commission_reference
  BEFORE INSERT ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION set_commission_reference();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update timestamps
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_commissions_updated_at ON commissions;
CREATE TRIGGER trigger_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for commissions table
CREATE POLICY "Users can view own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own commissions"
  ON commissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commissions"
  ON commissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own commissions"
  ON commissions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for portfolio_projects table
CREATE POLICY "Anyone can view portfolio projects"
  ON portfolio_projects FOR SELECT
  TO authenticated, anon
  USING (true);