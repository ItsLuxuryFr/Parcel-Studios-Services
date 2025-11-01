/*
  # Add Completed By Tracking Fields

  This migration adds fields to track which admin completed each project.

  ## New Columns

  - `completed_by_admin_id` (uuid, nullable) - ID of the admin who completed the project
  - `completed_by_admin_name` (text, nullable) - Name of the admin who completed the project

  ## Usage

  - Set when project is completed via the admin panel
  - Displayed in commission details to show who completed the project
  - Used for audit trail and accountability
*/

-- Add completed by admin tracking columns
ALTER TABLE commissions 
ADD COLUMN completed_by_admin_id uuid REFERENCES profiles(id);

ALTER TABLE commissions 
ADD COLUMN completed_by_admin_name text;

-- Add comments for clarity
COMMENT ON COLUMN commissions.completed_by_admin_id IS 'ID of the admin who completed the project';
COMMENT ON COLUMN commissions.completed_by_admin_name IS 'Display name of the admin who completed the project';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_commissions_completed_by_admin_id ON commissions(completed_by_admin_id);
