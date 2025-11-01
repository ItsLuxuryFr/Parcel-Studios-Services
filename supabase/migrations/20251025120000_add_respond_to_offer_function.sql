-- Secure RPC to respond to an offer message
-- Allows a conversation participant who owns the linked commission (or an admin)
-- to set offer_status and offer_responded_at, and on acceptance updates commission price.

CREATE OR REPLACE FUNCTION respond_to_offer(
  p_message_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := false;
  v_message RECORD;
  v_is_participant boolean := false;
  v_is_sender boolean := false;
  v_commission_owner uuid := NULL;
BEGIN
  -- Validate status input
  IF p_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status. Must be accepted or rejected';
  END IF;

  -- Get admin flag
  SELECT COALESCE(is_admin, false)
  INTO v_is_admin
  FROM profiles
  WHERE id = auth.uid();

  -- Fetch message with related info
  SELECT m.id,
         m.conversation_id,
         m.sender_id,
         m.is_offer,
         m.offer_price,
         m.commission_id
  INTO v_message
  FROM messages m
  WHERE m.id = p_message_id;

  IF v_message.id IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  IF NOT v_message.is_offer THEN
    RAISE EXCEPTION 'Message is not an offer';
  END IF;

  -- Ensure caller participates in the conversation
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = v_message.conversation_id
      AND cp.user_id = auth.uid()
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'Not authorized to respond to this offer';
  END IF;

  -- Prevent the sender from responding to their own offer
  v_is_sender := (v_message.sender_id = auth.uid());
  IF v_is_sender THEN
    RAISE EXCEPTION 'Sender cannot respond to own offer';
  END IF;

  -- Get commission owner (may be null if no commission linked)
  IF v_message.commission_id IS NOT NULL THEN
    SELECT user_id INTO v_commission_owner
    FROM commissions
    WHERE id = v_message.commission_id;
  END IF;

  -- Authorize: commission owner or admin
  IF NOT (v_is_admin OR (v_commission_owner IS NOT NULL AND v_commission_owner = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized to respond to this offer';
  END IF;

  -- Update the message offer status
  UPDATE messages
  SET offer_status = p_status,
      offer_responded_at = now()
  WHERE id = p_message_id;

  -- If accepted, sync commission proposed amount to offer price
  IF p_status = 'accepted' AND v_message.commission_id IS NOT NULL AND v_message.offer_price IS NOT NULL THEN
    UPDATE commissions
    SET proposed_amount = v_message.offer_price
    WHERE id = v_message.commission_id;
  END IF;
END;
$$;


