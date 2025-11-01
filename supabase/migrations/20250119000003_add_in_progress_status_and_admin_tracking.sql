/*
  # Add In Progress status and admin tracking for project start

  1. Changes
    - Add 'in_progress' status to commissions table constraint
    - Add 'started_by_admin_id' column to track which admin started the project
    - Add 'started_at' column to track when the project was started
    
  2. Notes
    - 'in_progress' status comes after 'accepted' and before 'completed'
    - Admin tracking helps with accountability and project management
    - Foreign key constraint ensures data integrity
*/

-- Add new columns for admin tracking
DO $$
BEGIN
  -- Add started_by_admin_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions' AND column_name = 'started_by_admin_id'
  ) THEN
    ALTER TABLE commissions ADD COLUMN started_by_admin_id uuid REFERENCES profiles(id);
  END IF;

  -- Add started_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE commissions ADD COLUMN started_at timestamptz;
  END IF;
END $$;

-- Drop the old constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commissions_status_check'
  ) THEN
    ALTER TABLE commissions DROP CONSTRAINT commissions_status_check;
  END IF;
END $$;

-- Add updated constraint with in_progress status
ALTER TABLE commissions ADD CONSTRAINT commissions_status_check 
  CHECK (status IN ('draft', 'submitted', 'in_review', 'accepted', 'in_progress', 'approved', 'rejected', 'completed', 'archived'));

-- Add index for better query performance on started_by_admin_id
CREATE INDEX IF NOT EXISTS idx_commissions_started_by_admin_id ON commissions(started_by_admin_id);

-- Add index for better query performance on started_at
CREATE INDEX IF NOT EXISTS idx_commissions_started_at ON commissions(started_at);
