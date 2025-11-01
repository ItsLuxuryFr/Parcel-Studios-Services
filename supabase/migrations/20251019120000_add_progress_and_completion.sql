/*
  # Add Progress and Completion Fields to Commissions

  This migration adds progress tracking and project completion functionality to the commissions table.

  ## New Columns

  - `progress` (integer, default 0) - Progress percentage (0-100)
  - `completion_files` (text[], default '{}') - Array of file URLs from Supabase Storage
  - `completed_at` (timestamptz, nullable) - Timestamp when project was completed

  ## Constraints

  - Progress must be between 0 and 100
  - Completion files are stored as an array of URLs
  - Completed at is only set when project is marked as completed

  ## Usage

  - Admins can update progress via slider in All My Projects tab
  - When progress reaches 100%, admin can upload completion files
  - Users can view progress and download completion files
*/

-- Add progress column with constraint
ALTER TABLE commissions 
ADD COLUMN progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- Add completion files column
ALTER TABLE commissions 
ADD COLUMN completion_files text[] DEFAULT '{}';

-- Add completed at timestamp
ALTER TABLE commissions 
ADD COLUMN completed_at timestamptz;

-- Add comments for clarity
COMMENT ON COLUMN commissions.progress IS 'Progress percentage (0-100) for in-progress commissions';
COMMENT ON COLUMN commissions.completion_files IS 'Array of file URLs uploaded when project is completed';
COMMENT ON COLUMN commissions.completed_at IS 'Timestamp when the project was completed';

-- Create index on progress for performance
CREATE INDEX IF NOT EXISTS idx_commissions_progress ON commissions(progress);

-- Create index on completed_at for performance
CREATE INDEX IF NOT EXISTS idx_commissions_completed_at ON commissions(completed_at);
