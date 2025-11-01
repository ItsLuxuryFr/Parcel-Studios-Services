-- Add conversation display order feature
-- This migration adds the ability for users to customize the order of their conversations via drag-and-drop

-- Add display_order column to conversation_participants table
ALTER TABLE conversation_participants 
ADD COLUMN IF NOT EXISTS display_order integer;

-- Create index for performance on display_order queries
CREATE INDEX IF NOT EXISTS idx_conversation_participants_display_order 
ON conversation_participants(user_id, display_order) 
WHERE display_order IS NOT NULL;

-- Drop the existing function to recreate it with new return type
DROP FUNCTION IF EXISTS get_user_conversations_with_participants(UUID);

-- Recreate the function to include display_order and order by it
CREATE OR REPLACE FUNCTION get_user_conversations_with_participants(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  last_message_at TIMESTAMPTZ,
  last_message_content TEXT,
  last_message_sender_id UUID,
  last_message_sender_name TEXT,
  unread_count BIGINT,
  nickname TEXT,
  is_pinned BOOLEAN,
  display_order INTEGER,
  participants JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_conversations AS (
    SELECT DISTINCT cp.conversation_id, cp.display_order
    FROM conversation_participants cp
    WHERE cp.user_id = p_user_id
      AND cp.is_hidden = false
  ),
  conversation_data AS (
    SELECT 
      c.id as conversation_id,
      c.last_message_at,
      c.nickname,
      c.is_pinned,
      uc.display_order,
      -- Get last message details
      m.content as last_message_content,
      m.sender_id as last_message_sender_id,
      p.display_name as last_message_sender_name
    FROM conversations c
    JOIN user_conversations uc ON c.id = uc.conversation_id
    LEFT JOIN messages m ON c.id = m.conversation_id 
      AND m.created_at = c.last_message_at
      AND m.is_deleted = false
    LEFT JOIN profiles p ON m.sender_id = p.id
  ),
  unread_counts AS (
    SELECT 
      m.conversation_id,
      COUNT(*) as unread_count
    FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = p_user_id
      AND cp.is_hidden = false
      AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
      AND m.sender_id != p_user_id
      AND m.is_deleted = false
    GROUP BY m.conversation_id
  ),
  participants_data AS (
    SELECT 
      cp.conversation_id,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'user_id', cp.user_id,
          'display_name', p.display_name,
          'avatar', p.avatar,
          'joined_at', cp.joined_at,
          'last_read_at', cp.last_read_at
        )
      ) as participants
    FROM conversation_participants cp
    JOIN profiles p ON cp.user_id = p.id
    WHERE cp.conversation_id IN (SELECT uc.conversation_id FROM user_conversations uc)
    GROUP BY cp.conversation_id
  )
  SELECT 
    cd.conversation_id,
    cd.last_message_at,
    cd.last_message_content,
    cd.last_message_sender_id,
    cd.last_message_sender_name,
    COALESCE(uc.unread_count, 0) as unread_count,
    cd.nickname,
    cd.is_pinned,
    cd.display_order,
    pd.participants
  FROM conversation_data cd
  LEFT JOIN unread_counts uc ON cd.conversation_id = uc.conversation_id
  LEFT JOIN participants_data pd ON cd.conversation_id = pd.conversation_id
  ORDER BY 
    cd.is_pinned DESC,  -- Pinned conversations first (true sorts before false in DESC)
    cd.display_order ASC NULLS LAST,  -- Then by display_order within each group
    cd.last_message_at DESC NULLS LAST;  -- Finally by last message time
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_conversations_with_participants(UUID) TO authenticated;

