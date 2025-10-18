/*
  # Add rejection reason field and update status handling

  1. Changes
    - Add `rejection_reason` column to commissions table to store admin's reason for rejection
    - Update check constraint to include 'accepted' and 'archived' statuses
    
  2. Notes
    - rejection_reason is optional (nullable) and only populated when status is 'rejected'
    - 'accepted' replaces 'approved' as the status when admin accepts a commission
    - 'archived' is used when users archive their commissions
*/

DO $$
BEGIN
  -- Add rejection_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE commissions ADD COLUMN rejection_reason text;
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

-- Add updated constraint with new statuses
ALTER TABLE commissions ADD CONSTRAINT commissions_status_check 
  CHECK (status IN ('draft', 'submitted', 'in_review', 'accepted', 'approved', 'rejected', 'completed', 'archived'));