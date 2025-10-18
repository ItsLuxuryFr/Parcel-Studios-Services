/*
  # Complete Database Schema for Parcel Studio

  ## Overview
  Creates the complete database schema for a Roblox commission service platform with user profiles, commissions, and portfolio projects.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, primary key) - Links to auth.users.id
  - `email` (text, not null) - User's email address
  - `display_name` (text, default '') - User's display name
  - `avatar` (text) - Profile picture URL
  - `bio` (text) - User biography
  - `onboarding_completed` (boolean, default false) - Whether user completed onboarding
  - `created_at` (timestamptz, default now()) - Account creation timestamp
  - `updated_at` (timestamptz, default now()) - Last profile update timestamp

  ### 2. commissions
  - `id` (uuid, primary key) - Commission unique identifier
  - `user_id` (uuid, not null) - References profiles(id)
  - `reference_number` (text, unique, not null) - Human-readable reference like "COM-12345"
  - `task_complexity` (text, not null) - One of: easy, medium, hard, extreme
  - `subject` (text, not null) - Commission title/subject
  - `description` (text, not null) - Detailed description
  - `proposed_amount` (numeric, not null) - Client's proposed payment amount
  - `status` (text, not null, default 'draft') - One of: draft, submitted, in_review, approved, rejected, completed
  - `created_at` (timestamptz, default now()) - Creation timestamp
  - `updated_at` (timestamptz, default now()) - Last update timestamp

  ### 3. portfolio_projects
  - `id` (uuid, primary key) - Project unique identifier
  - `category` (text, not null) - One of: scripting, vfx, building, uiux
  - `title` (text, not null) - Project title
  - `short_caption` (text, not null) - Brief description
  - `description` (text, not null) - Full project description
  - `thumbnail_url` (text, not null) - Main project image
  - `video_url` (text) - Optional video showcase
  - `images` (text[], default '{}') - Array of additional image URLs
  - `tags` (text[], default '{}') - Project tags
  - `skills` (text[], default '{}') - Skills demonstrated
  - `completion_date` (date, not null) - When project was completed
  - `featured` (boolean, default false) - Whether to feature on homepage
  - `display_order` (integer, default 0) - Order for displaying projects
  - `created_at` (timestamptz, default now()) - Creation timestamp
  - `updated_at` (timestamptz, default now()) - Last update timestamp

  ## Security (Row Level Security)

  ### profiles table:
  - RLS enabled
  - Anyone can view profiles (public portfolio)
  - Users can only update their own profile
  - Profile creation handled by trigger when auth user is created

  ### commissions table:
  - RLS enabled
  - Users can view their own commissions
  - Users can insert their own commissions
  - Users can update their own commissions
  - Admin can view all commissions (future enhancement)

  ### portfolio_projects table:
  - RLS enabled
  - Anyone can view portfolio projects (public)
  - Only admin can create/update/delete projects (managed separately)

  ## Functions & Triggers

  ### handle_new_user()
  - Automatically creates a profile when a new user signs up
  - Runs with SECURITY DEFINER to bypass RLS
  - Copies email and display_name from auth.users metadata

  ### update_updated_at_column()
  - Automatically updates updated_at timestamp on row changes
  - Applied to profiles, commissions, and portfolio_projects tables

  ### generate_commission_reference()
  - Generates unique reference numbers for commissions
  - Format: COM-XXXXX where XXXXX is a 5-digit number
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text DEFAULT '' NOT NULL,
  avatar text,
  bio text,
  onboarding_completed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies: public read, users can update own profile
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- COMMISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference_number text UNIQUE NOT NULL,
  task_complexity text NOT NULL CHECK (task_complexity IN ('easy', 'medium', 'hard', 'extreme')),
  subject text NOT NULL,
  description text NOT NULL,
  proposed_amount numeric NOT NULL CHECK (proposed_amount >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'completed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Commissions policies: users can manage their own commissions
CREATE POLICY "Users can view own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commissions"
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

-- =====================================================
-- PORTFOLIO PROJECTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category text NOT NULL CHECK (category IN ('scripting', 'vfx', 'building', 'uiux')),
  title text NOT NULL,
  short_caption text NOT NULL,
  description text NOT NULL,
  thumbnail_url text NOT NULL,
  video_url text,
  images text[] DEFAULT '{}' NOT NULL,
  tags text[] DEFAULT '{}' NOT NULL,
  skills text[] DEFAULT '{}' NOT NULL,
  completion_date date NOT NULL,
  featured boolean DEFAULT false NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Portfolio policies: public read access
CREATE POLICY "Anyone can view portfolio projects"
  ON portfolio_projects FOR SELECT
  USING (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: Generate commission reference number
CREATE OR REPLACE FUNCTION generate_commission_reference()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_ref text;
  ref_exists boolean;
BEGIN
  LOOP
    new_ref := 'COM-' || LPAD(floor(random() * 100000)::text, 5, '0');
    SELECT EXISTS(SELECT 1 FROM commissions WHERE reference_number = new_ref) INTO ref_exists;
    EXIT WHEN NOT ref_exists;
  END LOOP;
  RETURN new_ref;
END;
$$;

-- Function: Handle new user creation
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

-- Function: Set commission reference before insert
CREATE OR REPLACE FUNCTION set_commission_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := generate_commission_reference();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: Create profile on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger: Update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on commissions
DROP TRIGGER IF EXISTS update_commissions_updated_at ON commissions;
CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Set commission reference number
DROP TRIGGER IF EXISTS set_commission_reference_trigger ON commissions;
CREATE TRIGGER set_commission_reference_trigger
  BEFORE INSERT ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION set_commission_reference();

-- Trigger: Update updated_at on portfolio_projects
DROP TRIGGER IF EXISTS update_portfolio_projects_updated_at ON portfolio_projects;
CREATE TRIGGER update_portfolio_projects_updated_at
  BEFORE UPDATE ON portfolio_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_category ON portfolio_projects(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_featured ON portfolio_projects(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_display_order ON portfolio_projects(display_order);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;