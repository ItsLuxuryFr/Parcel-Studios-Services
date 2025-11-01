-- Create optimized function to get user conversations with participants
CREATE OR REPLACE FUNCTION get_user_conversations_with_participants(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  last_message_at TIMESTAMPTZ,
  last_message_content TEXT,
  last_message_sender_id UUID,
  last_message_sender_name TEXT,
  unread_count BIGINT,
  nickname TEXT,
  participants JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_conversations AS (
    SELECT DISTINCT cp.conversation_id
    FROM conversation_participants cp
    WHERE cp.user_id = p_user_id
      AND cp.hidden_at IS NULL
  ),
  conversation_data AS (
    SELECT 
      c.id as conversation_id,
      c.last_message_at,
      c.nickname,
      -- Get last message details
      m.content as last_message_content,
      m.sender_id as last_message_sender_id,
      p.display_name as last_message_sender_name
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id 
      AND m.created_at = c.last_message_at
      AND m.is_deleted = false
    LEFT JOIN profiles p ON m.sender_id = p.id
    WHERE c.id IN (SELECT conversation_id FROM user_conversations)
  ),
  unread_counts AS (
    SELECT 
      m.conversation_id,
      COUNT(*) as unread_count
    FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = p_user_id
      AND cp.hidden_at IS NULL
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
          'joined_at', cp.created_at,
          'last_read_at', cp.last_read_at
        )
      ) as participants
    FROM conversation_participants cp
    JOIN profiles p ON cp.user_id = p.id
    WHERE cp.conversation_id IN (SELECT conversation_id FROM user_conversations)
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
    pd.participants
  FROM conversation_data cd
  LEFT JOIN unread_counts uc ON cd.conversation_id = uc.conversation_id
  LEFT JOIN participants_data pd ON cd.conversation_id = pd.conversation_id
  ORDER BY cd.last_message_at DESC NULLS LAST;
END;
$$;

-- Create optimized function to get messages with all related data
CREATE OR REPLACE FUNCTION get_messages_with_details(
  p_conversation_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  is_deleted BOOLEAN,
  commission_id UUID,
  commission JSONB,
  is_offer BOOLEAN,
  offer_price NUMERIC,
  offer_comments TEXT,
  offer_status TEXT,
  offer_responded_at TIMESTAMPTZ,
  offer_expired_at TIMESTAMPTZ,
  attachments JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH message_data AS (
    SELECT 
      m.id,
      m.conversation_id,
      m.sender_id,
      p.display_name as sender_name,
      p.avatar as sender_avatar,
      m.content,
      m.created_at,
      m.is_deleted,
      m.commission_id,
      m.is_offer,
      m.offer_price,
      m.offer_comments,
      m.offer_status,
      m.offer_responded_at,
      m.offer_expired_at
    FROM messages m
    JOIN profiles p ON m.sender_id = p.id
    WHERE m.conversation_id = p_conversation_id
      AND m.is_deleted = false
    ORDER BY m.created_at ASC
    LIMIT p_limit OFFSET p_offset
  ),
  commission_data AS (
    SELECT 
      md.id as message_id,
      JSONB_BUILD_OBJECT(
        'id', c.id,
        'user_id', c.user_id,
        'task_complexity', c.task_complexity,
        'subject', c.subject,
        'description', c.description,
        'proposed_amount', c.proposed_amount,
        'status', c.status,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'reference_number', c.reference_number,
        'tags', c.tags,
        'images', c.images,
        'rejection_reason', c.rejection_reason,
        'owner_name', c.owner_name,
        'started_by_admin_id', c.started_by_admin_id,
        'started_by_admin_name', c.started_by_admin_name,
        'started_at', c.started_at,
        'progress', c.progress,
        'completion_files', c.completion_files,
        'completed_at', c.completed_at,
        'completed_by_admin_id', c.completed_by_admin_id,
        'completed_by_admin_name', c.completed_by_admin_name,
        'payment_status', c.payment_status,
        'stripe_product_id', c.stripe_product_id,
        'stripe_price_id', c.stripe_price_id,
        'stripe_payment_link_url', c.stripe_payment_link_url,
        'paid_at', c.paid_at,
        'stripe_session_id', c.stripe_session_id,
        'payment_type', c.payment_type
      ) as commission
    FROM message_data md
    LEFT JOIN commissions c ON md.commission_id = c.id
    WHERE md.commission_id IS NOT NULL
  ),
  attachment_data AS (
    SELECT 
      md.id as message_id,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'id', ma.id,
          'message_id', ma.message_id,
          'file_url', ma.file_url,
          'file_name', ma.file_name,
          'file_size', ma.file_size,
          'file_type', ma.file_type,
          'created_at', ma.created_at
        )
      ) as attachments
    FROM message_data md
    LEFT JOIN message_attachments ma ON md.id = ma.message_id
    GROUP BY md.id
  )
  SELECT 
    md.id,
    md.conversation_id,
    md.sender_id,
    md.sender_name,
    md.sender_avatar,
    md.content,
    md.created_at,
    md.is_deleted,
    md.commission_id,
    cd.commission,
    md.is_offer,
    md.offer_price,
    md.offer_comments,
    md.offer_status,
    md.offer_responded_at,
    md.offer_expired_at,
    ad.attachments
  FROM message_data md
  LEFT JOIN commission_data cd ON md.id = cd.message_id
  LEFT JOIN attachment_data ad ON md.id = ad.message_id
  ORDER BY md.created_at ASC;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at 
ON messages(conversation_id, created_at DESC) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_hidden 
ON conversation_participants(user_id, hidden_at) 
WHERE hidden_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_sender_created 
ON messages(sender_id, created_at DESC) 
WHERE is_deleted = false;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_conversations_with_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_messages_with_details(UUID, UUID, INTEGER, INTEGER) TO authenticated;
