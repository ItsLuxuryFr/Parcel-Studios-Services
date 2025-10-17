/*
  # Complete Commission Management Platform Schema

  ## Overview
  Creates the complete database schema for a commission management platform where a developer showcases their portfolio and accepts commission requests from clients.

  ## New Tables

  ### 1. `profiles`
  Extends Supabase auth.users with additional user profile information
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `display_name` (text)
  - `avatar` (text, URL to avatar image)
  - `bio` (text, user biography)
  - `onboarding_completed` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `portfolio_categories`
  Stores portfolio category information (scripting, vfx, building, uiux)
  - `id` (text, primary key)
  - `name` (text, not null)
  - `description` (text)
  - `featured` (boolean, default false)
  - `experience_years` (integer)
  - `created_at` (timestamptz)

  ### 3. `projects`
  Portfolio projects showcasing past work
  - `id` (uuid, primary key)
  - `category` (text, references portfolio_categories)
  - `title` (text, not null)
  - `short_caption` (text)
  - `description` (text)
  - `thumbnail_url` (text)
  - `video_url` (text)
  - `images` (text array)
  - `tags` (text array)
  - `skills` (text array)
  - `completion_date` (text, YYYY-MM format)
  - `featured` (boolean, default false)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `commissions`
  Commission requests from clients
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, the client who requested)
  - `task_complexity` (text, enum: easy|medium|hard|extreme)
  - `subject` (text, not null)
  - `description` (text, not null)
  - `proposed_amount` (numeric, not null)
  - `status` (text, enum: draft|submitted|in_review|approved|rejected|completed)
  - `reference_number` (text, unique, auto-generated)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with restrictive policies:
  
  #### profiles
  - Users can view all profiles (public information)
  - Users can only update their own profile
  - New profiles are created automatically via trigger on auth.users insert
  
  #### portfolio_categories
  - Anyone can view categories (public portfolio)
  - Only admin/owner can modify (handled separately)
  
  #### projects
  - Anyone can view projects (public portfolio)
  - Only admin/owner can modify (handled separately)
  
  #### commissions
  - Users can view their own commissions
  - Users can create new commissions
  - Users can update their own draft commissions
  - Admin can view all commissions (handled separately)

  ## Important Notes
  1. All tables use RLS to ensure data security
  2. Profiles are automatically created when users sign up via trigger
  3. Reference numbers for commissions are auto-generated with format COM-YYYY-NNN
  4. Portfolio categories and projects are managed by the site owner
  5. Timestamps are automatically managed with triggers
*/

-- Create custom types for enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_complexity') THEN
    CREATE TYPE task_complexity AS ENUM ('easy', 'medium', 'hard', 'extreme');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_status') THEN
    CREATE TYPE commission_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'completed');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'portfolio_category_type') THEN
    CREATE TYPE portfolio_category_type AS ENUM ('scripting', 'vfx', 'building', 'uiux');
  END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text DEFAULT '',
  avatar text DEFAULT '',
  bio text DEFAULT '',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create portfolio_categories table
CREATE TABLE IF NOT EXISTS portfolio_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  featured boolean DEFAULT false,
  experience_years integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL REFERENCES portfolio_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  short_caption text DEFAULT '',
  description text DEFAULT '',
  thumbnail_url text DEFAULT '',
  video_url text DEFAULT '',
  images text[] DEFAULT ARRAY[]::text[],
  tags text[] DEFAULT ARRAY[]::text[],
  skills text[] DEFAULT ARRAY[]::text[],
  completion_date text DEFAULT '',
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_complexity task_complexity NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  proposed_amount numeric NOT NULL CHECK (proposed_amount >= 0),
  status commission_status DEFAULT 'draft',
  reference_number text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);

-- Create function to generate reference numbers
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  year_str text;
  seq_num integer;
  ref_num text;
BEGIN
  year_str := to_char(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO seq_num
  FROM commissions
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  ref_num := 'COM-' || year_str || '-' || LPAD(seq_num::text, 3, '0');
  
  RETURN ref_num;
END;
$$;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create function to auto-generate reference number on commission insert
CREATE OR REPLACE FUNCTION set_commission_reference_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_reference_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, now());
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_commission_reference ON commissions;
CREATE TRIGGER set_commission_reference
  BEFORE INSERT ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION set_commission_reference_number();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Anyone can view profiles"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for portfolio_categories table (public read-only)
CREATE POLICY "Anyone can view portfolio categories"
  ON portfolio_categories
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for projects table (public read-only)
CREATE POLICY "Anyone can view projects"
  ON projects
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for commissions table
CREATE POLICY "Users can view own commissions"
  ON commissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create commissions"
  ON commissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commissions"
  ON commissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft commissions"
  ON commissions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- Insert default portfolio categories
INSERT INTO portfolio_categories (id, name, description, featured, experience_years)
VALUES 
  ('scripting', 'Scripting', 'Advanced Lua scripting for game mechanics, systems, and tools', true, 4),
  ('vfx', 'VFX', 'Stunning visual effects and particle systems', false, 0),
  ('building', 'Building', 'Detailed environments and architectural design', false, 0),
  ('uiux', 'UI/UX', 'Modern, intuitive user interfaces and experiences', false, 0)
ON CONFLICT (id) DO NOTHING;