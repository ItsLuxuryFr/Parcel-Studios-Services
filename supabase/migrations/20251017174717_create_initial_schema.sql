/*
  # Initial Database Schema for Art Commission Platform

  ## Overview
  Creates the core database structure for managing user profiles, portfolio projects, and commission requests.

  ## New Tables
  
  ### 1. `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, primary key) - References auth.users(id)
  - `email` (text, unique, not null) - User email address
  - `display_name` (text) - User's display name
  - `avatar` (text) - Avatar image URL
  - `bio` (text) - User biography
  - `onboarding_completed` (boolean) - Onboarding status flag
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `projects`
  Portfolio projects showcasing work
  - `id` (uuid, primary key) - Unique project identifier
  - `category` (text) - Project category (scripting/vfx/building/uiux)
  - `title` (text, not null) - Project title
  - `short_caption` (text) - Brief description
  - `description` (text) - Detailed project description
  - `thumbnail_url` (text) - Main thumbnail image
  - `video_url` (text) - Optional video URL
  - `images` (text[]) - Array of image URLs
  - `tags` (text[]) - Project tags
  - `skills` (text[]) - Skills demonstrated
  - `completion_date` (date) - Project completion date
  - `featured` (boolean) - Featured project flag
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. `commissions`
  Commission requests from users
  - `id` (uuid, primary key) - Unique commission identifier
  - `user_id` (uuid, not null) - References profiles(id)
  - `task_complexity` (text) - Complexity level (easy/medium/hard/extreme)
  - `subject` (text, not null) - Commission subject/title
  - `description` (text, not null) - Detailed description
  - `proposed_amount` (numeric) - Proposed payment amount
  - `status` (text) - Current status (draft/submitted/in_review/approved/rejected/completed)
  - `reference_number` (text, unique) - Unique reference code
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Profiles: Users can view all profiles, but only update their own
  - Projects: Public read access, admin-only write access
  - Commissions: Users can only view and manage their own commissions

  ## Indexes
  - Add indexes on foreign keys and frequently queried columns
  - Commission reference_number for quick lookups
  - Profile email for user searches
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  avatar text,
  bio text,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category text NOT NULL CHECK (category IN ('scripting', 'vfx', 'building', 'uiux')),
  title text NOT NULL,
  short_caption text,
  description text,
  thumbnail_url text,
  video_url text,
  images text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  skills text[] DEFAULT '{}',
  completion_date date,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_complexity text NOT NULL CHECK (task_complexity IN ('easy', 'medium', 'hard', 'extreme')),
  subject text NOT NULL,
  description text NOT NULL,
  proposed_amount numeric(10,2) NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'completed')),
  reference_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_reference_number ON commissions(reference_number);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Projects policies (public read, admin write)
CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

-- Commissions policies
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

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
