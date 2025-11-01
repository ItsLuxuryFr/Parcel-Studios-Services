-- Add commission reference support to messages
-- This migration adds the ability to reference commissions in messages

-- Add commission_id column to messages table
ALTER TABLE messages 
ADD COLUMN commission_id uuid REFERENCES commissions(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_messages_commission_id ON messages(commission_id);

-- Update RLS policy to allow reading commission data when viewing messages
-- Users can view commission details for commissions they own or that are referenced in their conversations
CREATE POLICY "Users can view commission details from their messages"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    -- User owns the commission OR commission is referenced in a message from their conversation
    user_id = auth.uid() OR
    id IN (
      SELECT m.commission_id 
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = auth.uid() 
      AND m.commission_id IS NOT NULL
    )
  );

-- Create function to clean up commission references when commission is deleted
CREATE OR REPLACE FUNCTION cleanup_commission_references()
RETURNS trigger AS $$
BEGIN
  -- Set commission_id to NULL for all messages that referenced the deleted commission
  UPDATE messages 
  SET commission_id = NULL 
  WHERE commission_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up commission references on commission deletion
DROP TRIGGER IF EXISTS trigger_cleanup_commission_references ON commissions;
CREATE TRIGGER trigger_cleanup_commission_references
  AFTER DELETE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_commission_references();

-- Create function to get messages with commission data
CREATE OR REPLACE FUNCTION get_messages_with_commissions(p_conversation_id uuid)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  content text,
  created_at timestamptz,
  is_deleted boolean,
  commission_id uuid,
  commission_data jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.created_at,
    m.is_deleted,
    m.commission_id,
    CASE 
      WHEN m.commission_id IS NOT NULL THEN
        jsonb_build_object(
          'id', c.id,
          'userId', c.user_id,
          'taskComplexity', c.task_complexity,
          'subject', c.subject,
          'description', c.description,
          'proposedAmount', c.proposed_amount,
          'status', c.status,
          'createdAt', c.created_at,
          'updatedAt', c.updated_at,
          'referenceNumber', c.reference_number,
          'tags', c.tags,
          'images', c.images,
          'rejectionReason', c.rejection_reason,
          'ownerName', c.owner_name,
          'startedByAdminId', c.started_by_admin_id,
          'startedByAdminName', c.started_by_admin_name,
          'startedAt', c.started_at,
          'progress', c.progress,
          'completionFiles', c.completion_files,
          'completedAt', c.completed_at,
          'completedByAdminId', c.completed_by_admin_id,
          'completedByAdminName', c.completed_by_admin_name
        )
      ELSE NULL
    END as commission_data
  FROM messages m
  LEFT JOIN commissions c ON m.commission_id = c.id
  WHERE m.conversation_id = p_conversation_id
  AND m.is_deleted = false
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
