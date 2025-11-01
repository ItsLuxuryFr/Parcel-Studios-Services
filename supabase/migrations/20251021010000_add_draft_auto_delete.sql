/*
  # Draft Commission Auto-Delete System

  This migration adds automatic deletion of draft commissions after 7 days
  based on their last update time. This extends the existing auto-delete
  system to include draft commissions.

  ## Changes

  1. Creates a function to delete old draft commissions (7 days from updated_at)
  2. Updates the existing cleanup_old_data() function to include draft cleanup
  3. Ensures the trigger-based cleanup includes drafts

  ## Notes

  - Only commissions with status 'draft' and updated_at older than 7 days are deleted
  - The function logs how many draft commissions were deleted
  - Integrates with existing auto-delete system
*/

-- Function to delete old draft commissions (older than 7 days from last update)
CREATE OR REPLACE FUNCTION delete_old_draft_commissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Delete draft commissions older than 7 days from last update
  DELETE FROM commissions 
  WHERE status = 'draft' 
  AND updated_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  IF deleted_count > 0 THEN
    RAISE LOG 'Deleted % draft commissions older than 7 days', deleted_count;
  END IF;
END;
$$;

-- Update the existing cleanup_old_data function to include draft cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Run all cleanup functions including the new draft cleanup
  PERFORM delete_old_completion_files();
  PERFORM delete_old_completed_commissions();
  PERFORM delete_old_archived_commissions();
  PERFORM delete_old_draft_commissions();
  
  RAISE LOG 'Completed automatic data cleanup at %', NOW();
END;
$$;

-- Grant necessary permissions for the new function
GRANT EXECUTE ON FUNCTION delete_old_draft_commissions() TO postgres;

-- Add comments for documentation
COMMENT ON FUNCTION delete_old_draft_commissions() IS 'Deletes draft commissions older than 7 days from last update';
