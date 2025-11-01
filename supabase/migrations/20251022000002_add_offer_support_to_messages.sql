-- Add offer support to messages
-- This migration adds the ability to create and respond to offers in messages

-- Add offer-related columns to messages table
ALTER TABLE messages 
ADD COLUMN is_offer boolean DEFAULT false,
ADD COLUMN offer_price numeric,
ADD COLUMN offer_comments text,
ADD COLUMN offer_status text,
ADD COLUMN offer_responded_at timestamptz;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_messages_is_offer ON messages(is_offer);
CREATE INDEX IF NOT EXISTS idx_messages_offer_status ON messages(offer_status);

-- Update the get_messages_with_commissions function to include offer fields
CREATE OR REPLACE FUNCTION get_messages_with_commissions(p_conversation_id uuid)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  sender_id uuid,
  content text,
  created_at timestamptz,
  is_deleted boolean,
  commission_id uuid,
  commission_data jsonb,
  is_offer boolean,
  offer_price numeric,
  offer_comments text,
  offer_status text,
  offer_responded_at timestamptz
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
          'completedByAdminName', c.completed_by_admin_name,
          'paymentStatus', c.payment_status,
          'stripeProductId', c.stripe_product_id,
          'stripePriceId', c.stripe_price_id,
          'stripePaymentLinkUrl', c.stripe_payment_link_url,
          'paidAt', c.paid_at,
          'stripeSessionId', c.stripe_session_id,
          'stripeCheckoutSessionId', c.stripe_checkout_session_id,
          'paymentAbandonedAt', c.payment_abandoned_at,
          'productArchivedAt', c.product_archived_at
        )
      ELSE NULL
    END as commission_data,
    m.is_offer,
    m.offer_price,
    m.offer_comments,
    m.offer_status,
    m.offer_responded_at
  FROM messages m
  LEFT JOIN commissions c ON m.commission_id = c.id
  WHERE m.conversation_id = p_conversation_id
  AND m.is_deleted = false
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

