-- Add conversation hide feature
-- This migration adds the ability for users to hide conversations from their view
-- without deleting the actual messages or affecting other participants

-- Add is_hidden column to conversation_participants table
ALTER TABLE conversation_participants 
ADD COLUMN is_hidden boolean DEFAULT false;

-- Create index for performance on is_hidden queries
CREATE INDEX IF NOT EXISTS idx_conversation_participants_is_hidden 
ON conversation_participants(user_id, is_hidden) 
WHERE is_hidden = false;

-- Update the get_user_conversations function to filter out hidden conversations
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  last_message_at timestamptz,
  last_message_content text,
  last_message_sender_id uuid,
  last_message_sender_name text,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.last_message_at,
    m.content as last_message_content,
    m.sender_id as last_message_sender_id,
    p.display_name as last_message_sender_name,
    COALESCE(
      (SELECT COUNT(*) 
       FROM messages m2 
       WHERE m2.conversation_id = c.id 
       AND m2.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
       AND m2.sender_id != p_user_id
       AND m2.is_deleted = false
      ), 0
    ) as unread_count
  FROM conversations c
  JOIN conversation_participants cp ON c.id = cp.conversation_id
  LEFT JOIN messages m ON c.id = m.conversation_id AND m.created_at = c.last_message_at
  LEFT JOIN profiles p ON m.sender_id = p.id
  WHERE cp.user_id = p_user_id
    AND cp.is_hidden = false  -- Filter out hidden conversations
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to hide a conversation for a user
CREATE OR REPLACE FUNCTION hide_conversation(p_conversation_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE conversation_participants 
  SET is_hidden = true
  WHERE conversation_id = p_conversation_id 
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to unhide a conversation for a user
CREATE OR REPLACE FUNCTION unhide_conversation(p_conversation_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE conversation_participants 
  SET is_hidden = false
  WHERE conversation_id = p_conversation_id 
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically unhide conversation when new message arrives
-- This will be called from the message insert trigger
CREATE OR REPLACE FUNCTION auto_unhide_conversation_on_message()
RETURNS trigger AS $$
BEGIN
  -- Unhide the conversation for all participants when a new message is added
  UPDATE conversation_participants 
  SET is_hidden = false
  WHERE conversation_id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-unhide conversations when new messages arrive
DROP TRIGGER IF EXISTS trigger_auto_unhide_conversation ON messages;
CREATE TRIGGER trigger_auto_unhide_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_unhide_conversation_on_message();
