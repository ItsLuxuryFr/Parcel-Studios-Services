/*
  # Add in_progress status to commissions table

  1. Changes
    - Add 'in_progress' status to the existing constraint
    - Add admin tracking columns for project start
    
  2. Notes
    - This is a simpler migration that just adds the status
    - Admin tracking columns are added separately
*/

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

-- Add admin tracking columns
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

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_commissions_started_by_admin_id ON commissions(started_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_commissions_started_at ON commissions(started_at);
