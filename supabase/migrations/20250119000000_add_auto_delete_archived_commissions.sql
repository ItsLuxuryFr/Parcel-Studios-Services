/*
  # Auto-delete archived commissions after 7 days

  This migration creates a function and scheduled job to automatically delete
  archived commissions that have been archived for more than 7 days.

  ## Changes

  1. Creates a function to delete old archived commissions
  2. Creates a scheduled job (using pg_cron) to run this function daily
  3. Adds an index on updated_at for better performance

  ## Notes

  - Only commissions with status 'archived' and updated_at older than 7 days are deleted
  - The function logs how many commissions were deleted
  - Requires pg_cron extension to be enabled
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create index on updated_at for better performance
CREATE INDEX IF NOT EXISTS idx_commissions_updated_at ON commissions(updated_at);

-- Create function to delete old archived commissions
CREATE OR REPLACE FUNCTION delete_old_archived_commissions()
RETURNS void AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete archived commissions older than 7 days
  WITH deleted AS (
    DELETE FROM commissions 
    WHERE status = 'archived' 
      AND updated_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  -- Log the deletion (optional - can be viewed in postgres logs)
  IF deleted_count > 0 THEN
    RAISE LOG 'Deleted % archived commissions older than 7 days', deleted_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run daily at 2 AM
-- Note: This requires pg_cron extension and appropriate permissions
-- The job will be created but may need manual activation depending on your setup
SELECT cron.schedule(
  'delete-old-archived-commissions',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT delete_old_archived_commissions();'
);

-- Alternative: If pg_cron is not available, you can manually run:
-- SELECT delete_old_archived_commissions();
