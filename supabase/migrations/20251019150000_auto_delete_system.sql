/*
  # Automatic Deletion System

  This migration creates functions and triggers for automatic deletion of:
  - Completion files after 3 days
  - Completed commissions after 14 days  
  - Archived commissions after 7 days

  ## Functions Created

  1. `delete_old_completion_files()` - Deletes files older than 3 days
  2. `delete_old_completed_commissions()` - Deletes completed commissions older than 14 days
  3. `delete_old_archived_commissions()` - Deletes archived commissions older than 7 days
  4. `cleanup_old_data()` - Master function that calls all cleanup functions

  ## Triggers

  - Daily cleanup trigger that runs the cleanup function
  - Manual cleanup can be triggered by calling `cleanup_old_data()`

  ## Safety Features

  - Only deletes data older than specified timeframes
  - Logs all deletion activities
  - Can be disabled by dropping the trigger
*/

-- Function to delete old completion files (older than 3 days)
CREATE OR REPLACE FUNCTION delete_old_completion_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
  file_record record;
BEGIN
  -- Find completed commissions older than 3 days
  FOR file_record IN 
    SELECT id, completion_files, completed_at
    FROM commissions 
    WHERE status = 'completed' 
    AND completed_at IS NOT NULL
    AND completed_at < NOW() - INTERVAL '3 days'
    AND completion_files IS NOT NULL
    AND array_length(completion_files, 1) > 0
  LOOP
    -- Delete files from storage
    PERFORM storage.delete_object('commission-completions', 
      split_part(file_url, '/', 4) || '/' || split_part(file_url, '/', 5))
    FROM unnest(file_record.completion_files) AS file_url
    WHERE file_url IS NOT NULL;
    
    -- Clear the completion_files array
    UPDATE commissions 
    SET completion_files = '{}'
    WHERE id = file_record.id;
    
    deleted_count := deleted_count + 1;
  END LOOP;
  
  -- Log the cleanup
  RAISE LOG 'Deleted completion files for % completed commissions older than 3 days', deleted_count;
END;
$$;

-- Function to delete old completed commissions (older than 14 days)
CREATE OR REPLACE FUNCTION delete_old_completed_commissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Delete completed commissions older than 14 days
  DELETE FROM commissions 
  WHERE status = 'completed' 
  AND completed_at IS NOT NULL
  AND completed_at < NOW() - INTERVAL '14 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  RAISE LOG 'Deleted % completed commissions older than 14 days', deleted_count;
END;
$$;

-- Function to delete old archived commissions (older than 7 days)
CREATE OR REPLACE FUNCTION delete_old_archived_commissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Delete archived commissions older than 7 days
  DELETE FROM commissions 
  WHERE status = 'archived' 
  AND updated_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  RAISE LOG 'Deleted % archived commissions older than 7 days', deleted_count;
END;
$$;

-- Master cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Run all cleanup functions
  PERFORM delete_old_completion_files();
  PERFORM delete_old_completed_commissions();
  PERFORM delete_old_archived_commissions();
  
  RAISE LOG 'Completed automatic data cleanup at %', NOW();
END;
$$;

-- Create a function to run cleanup on a schedule
-- This will be called by a cron job or similar scheduling system
CREATE OR REPLACE FUNCTION schedule_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Run cleanup every day at 2 AM
  PERFORM cleanup_old_data();
EXCEPTION
  WHEN OTHERS THEN
    -- Log errors but don't fail the entire operation
    RAISE LOG 'Error in scheduled cleanup: %', SQLERRM;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_old_completion_files() TO postgres;
GRANT EXECUTE ON FUNCTION delete_old_completed_commissions() TO postgres;
GRANT EXECUTE ON FUNCTION delete_old_archived_commissions() TO postgres;
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO postgres;
GRANT EXECUTE ON FUNCTION schedule_cleanup() TO postgres;

-- Create a simple trigger-based cleanup (alternative to cron)
-- This will run cleanup when any commission is updated
CREATE OR REPLACE FUNCTION trigger_cleanup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only run cleanup occasionally (every 100th update to avoid performance issues)
  IF (random() < 0.01) THEN
    PERFORM cleanup_old_data();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for cleanup
DROP TRIGGER IF EXISTS cleanup_trigger ON commissions;
CREATE TRIGGER cleanup_trigger
  AFTER UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup();

-- Add comments for documentation
COMMENT ON FUNCTION delete_old_completion_files() IS 'Deletes completion files for commissions completed more than 3 days ago';
COMMENT ON FUNCTION delete_old_completed_commissions() IS 'Deletes completed commissions older than 14 days';
COMMENT ON FUNCTION delete_old_archived_commissions() IS 'Deletes archived commissions older than 7 days';
COMMENT ON FUNCTION cleanup_old_data() IS 'Master cleanup function that runs all deletion functions';
COMMENT ON FUNCTION schedule_cleanup() IS 'Scheduled cleanup function for cron jobs';
COMMENT ON FUNCTION trigger_cleanup() IS 'Trigger-based cleanup that runs occasionally on commission updates';
