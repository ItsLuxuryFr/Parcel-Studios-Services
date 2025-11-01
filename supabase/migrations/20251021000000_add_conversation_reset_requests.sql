/*
  # Conversation Reset Request System

  This migration creates the database schema for conversation reset requests.
  Users can request to reset a conversation, and all participants must accept
  within 24 hours for the reset to execute.

  ## Tables Created

  1. **conversation_reset_requests** - Store reset request metadata
     - `id` (uuid, primary key) - Unique request ID
     - `conversation_id` (uuid, FK to conversations) - References conversations(id)
     - `requested_by_user_id` (uuid, FK to profiles) - Who initiated the request
     - `created_at` (timestamptz) - Request timestamp
     - `expires_at` (timestamptz) - Expiration timestamp (created_at + 1 day)
     - `status` (text) - 'pending', 'accepted', 'expired', 'cancelled'

  2. **conversation_reset_acceptances** - Track user acceptances
     - `reset_request_id` (uuid, FK to conversation_reset_requests)
     - `user_id` (uuid, FK to profiles) - User who accepted
     - `accepted_at` (timestamptz) - When they accepted
     - Primary key: (reset_request_id, user_id)

  ## Functions Created

  - `request_conversation_reset()` - Create new reset request
  - `accept_conversation_reset()` - Accept a reset request
  - `cancel_conversation_reset()` - Cancel a reset request
  - `execute_conversation_reset()` - Execute the reset (delete messages)
  - `get_active_reset_request()` - Get active request for conversation
  - `cleanup_expired_reset_requests()` - Clean up expired requests

  ## RLS Policies

  - Users can only view reset requests for their conversations
  - Users can only accept/cancel requests for their conversations
  - Only the requester can cancel a request
*/

-- Create conversation_reset_requests table
CREATE TABLE IF NOT EXISTS conversation_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  requested_by_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  UNIQUE(conversation_id, status) -- Only one active request per conversation
);

-- Create conversation_reset_acceptances table
CREATE TABLE IF NOT EXISTS conversation_reset_acceptances (
  reset_request_id uuid NOT NULL REFERENCES conversation_reset_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_at timestamptz DEFAULT now(),
  PRIMARY KEY (reset_request_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_reset_requests_conversation_id ON conversation_reset_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_reset_requests_status ON conversation_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_conversation_reset_requests_expires_at ON conversation_reset_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_conversation_reset_acceptances_reset_request_id ON conversation_reset_acceptances(reset_request_id);
CREATE INDEX IF NOT EXISTS idx_conversation_reset_acceptances_user_id ON conversation_reset_acceptances(user_id);

-- Function to request a conversation reset
CREATE OR REPLACE FUNCTION request_conversation_reset(p_conversation_id uuid, p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_reset_request_id uuid;
  v_expires_at timestamptz;
BEGIN
  -- Check if user is a participant in the conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Check if there's already an active request
  IF EXISTS (
    SELECT 1 FROM conversation_reset_requests 
    WHERE conversation_id = p_conversation_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'There is already an active reset request for this conversation';
  END IF;

  -- Set expiration to 24 hours from now
  v_expires_at := now() + interval '1 day';

  -- Create the reset request
  INSERT INTO conversation_reset_requests (conversation_id, requested_by_user_id, expires_at)
  VALUES (p_conversation_id, p_user_id, v_expires_at)
  RETURNING id INTO v_reset_request_id;

  -- Automatically add the requesting user's acceptance
  INSERT INTO conversation_reset_acceptances (reset_request_id, user_id)
  VALUES (v_reset_request_id, p_user_id);

  RETURN v_reset_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept a conversation reset
CREATE OR REPLACE FUNCTION accept_conversation_reset(p_reset_request_id uuid, p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_request conversation_reset_requests%ROWTYPE;
  v_participant_count integer;
  v_accepted_count integer;
  v_all_accepted boolean;
BEGIN
  -- Get the request details
  SELECT * INTO v_request FROM conversation_reset_requests WHERE id = p_reset_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reset request not found';
  END IF;

  -- Check if request is still pending
  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Reset request is no longer pending';
  END IF;

  -- Check if request has expired
  IF v_request.expires_at < now() THEN
    UPDATE conversation_reset_requests SET status = 'expired' WHERE id = p_reset_request_id;
    RAISE EXCEPTION 'Reset request has expired';
  END IF;

  -- Check if user is a participant in the conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = v_request.conversation_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Add user's acceptance (ignore if already exists)
  INSERT INTO conversation_reset_acceptances (reset_request_id, user_id)
  VALUES (p_reset_request_id, p_user_id)
  ON CONFLICT (reset_request_id, user_id) DO NOTHING;

  -- Count total participants and accepted users
  SELECT COUNT(*) INTO v_participant_count
  FROM conversation_participants 
  WHERE conversation_id = v_request.conversation_id;

  SELECT COUNT(*) INTO v_accepted_count
  FROM conversation_reset_acceptances 
  WHERE reset_request_id = p_reset_request_id;

  v_all_accepted := (v_accepted_count >= v_participant_count);

  -- If all participants have accepted, execute the reset
  IF v_all_accepted THEN
    PERFORM execute_conversation_reset(v_request.conversation_id);
    UPDATE conversation_reset_requests SET status = 'accepted' WHERE id = p_reset_request_id;
  END IF;

  -- Return status
  RETURN json_build_object(
    'accepted_count', v_accepted_count,
    'total_participants', v_participant_count,
    'all_accepted', v_all_accepted,
    'status', CASE WHEN v_all_accepted THEN 'accepted' ELSE 'pending' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel a conversation reset
CREATE OR REPLACE FUNCTION cancel_conversation_reset(p_reset_request_id uuid, p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_request conversation_reset_requests%ROWTYPE;
BEGIN
  -- Get the request details
  SELECT * INTO v_request FROM conversation_reset_requests WHERE id = p_reset_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reset request not found';
  END IF;

  -- Check if user is the requester
  IF v_request.requested_by_user_id != p_user_id THEN
    RAISE EXCEPTION 'Only the requester can cancel the reset request';
  END IF;

  -- Check if request is still pending
  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Reset request is no longer pending';
  END IF;

  -- Update status to cancelled
  UPDATE conversation_reset_requests SET status = 'cancelled' WHERE id = p_reset_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute conversation reset
CREATE OR REPLACE FUNCTION execute_conversation_reset(p_conversation_id uuid)
RETURNS void AS $$
DECLARE
  v_message_ids uuid[];
  v_attachment_urls text[];
BEGIN
  -- Get all message IDs for this conversation
  SELECT ARRAY_AGG(id) INTO v_message_ids
  FROM messages 
  WHERE conversation_id = p_conversation_id;

  -- Get all attachment URLs for deletion from storage
  SELECT ARRAY_AGG(ma.file_url) INTO v_attachment_urls
  FROM message_attachments ma
  JOIN messages m ON ma.message_id = m.id
  WHERE m.conversation_id = p_conversation_id;

  -- Delete message attachments from storage
  IF v_attachment_urls IS NOT NULL AND array_length(v_attachment_urls, 1) > 0 THEN
    -- Note: In a real implementation, you'd want to delete from Supabase Storage
    -- This would require additional storage API calls
    -- For now, we'll just delete the database records
  END IF;

  -- Delete message attachments (cascade will handle this, but being explicit)
  DELETE FROM message_attachments 
  WHERE message_id IN (SELECT id FROM messages WHERE conversation_id = p_conversation_id);

  -- Delete all messages
  DELETE FROM messages WHERE conversation_id = p_conversation_id;

  -- Clear typing indicators
  DELETE FROM typing_indicators WHERE conversation_id = p_conversation_id;

  -- Update conversation timestamps
  UPDATE conversations 
  SET 
    updated_at = now(),
    last_message_at = created_at
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active reset request for a conversation
CREATE OR REPLACE FUNCTION get_active_reset_request(p_conversation_id uuid)
RETURNS json AS $$
DECLARE
  v_request conversation_reset_requests%ROWTYPE;
  v_acceptances json;
  v_participant_count integer;
BEGIN
  -- Get the active request
  SELECT * INTO v_request 
  FROM conversation_reset_requests 
  WHERE conversation_id = p_conversation_id 
    AND status = 'pending' 
    AND expires_at > now()
  ORDER BY created_at DESC 
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get acceptance details
  SELECT json_agg(
    json_build_object(
      'userId', p.id,
      'userName', p.display_name,
      'acceptedAt', cra.accepted_at
    )
  ) INTO v_acceptances
  FROM conversation_reset_acceptances cra
  JOIN profiles p ON cra.user_id = p.id
  WHERE cra.reset_request_id = v_request.id;

  -- Count total participants
  SELECT COUNT(*) INTO v_participant_count
  FROM conversation_participants 
  WHERE conversation_id = p_conversation_id;

  -- Return the request with acceptance details
  RETURN json_build_object(
    'id', v_request.id,
    'conversationId', v_request.conversation_id,
    'requestedByUserId', v_request.requested_by_user_id,
    'createdAt', v_request.created_at,
    'expiresAt', v_request.expires_at,
    'status', v_request.status,
    'acceptances', COALESCE(v_acceptances, '[]'::json),
    'totalParticipants', v_participant_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired reset requests
CREATE OR REPLACE FUNCTION cleanup_expired_reset_requests()
RETURNS void AS $$
BEGIN
  -- Mark expired requests as expired
  UPDATE conversation_reset_requests 
  SET status = 'expired' 
  WHERE status = 'pending' AND expires_at < now();

  -- Delete old expired/cancelled requests (older than 7 days)
  DELETE FROM conversation_reset_requests 
  WHERE status IN ('expired', 'cancelled') 
    AND created_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE conversation_reset_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_reset_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_reset_requests
CREATE POLICY "Users can view reset requests for their conversations"
  ON conversation_reset_requests FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reset requests for their conversations"
  ON conversation_reset_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by_user_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reset requests they created"
  ON conversation_reset_requests FOR UPDATE
  TO authenticated
  USING (requested_by_user_id = auth.uid())
  WITH CHECK (requested_by_user_id = auth.uid());

-- RLS Policies for conversation_reset_acceptances
CREATE POLICY "Users can view acceptances for their conversations"
  ON conversation_reset_acceptances FOR SELECT
  TO authenticated
  USING (
    reset_request_id IN (
      SELECT id 
      FROM conversation_reset_requests 
      WHERE conversation_id IN (
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create acceptances for their conversations"
  ON conversation_reset_acceptances FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    reset_request_id IN (
      SELECT id 
      FROM conversation_reset_requests 
      WHERE conversation_id IN (
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create a trigger to automatically cleanup expired requests
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_reset_requests()
RETURNS trigger AS $$
BEGIN
  -- Cleanup expired requests when any reset request is accessed
  PERFORM cleanup_expired_reset_requests();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on conversation_reset_requests
CREATE TRIGGER trigger_cleanup_expired_reset_requests
  AFTER SELECT ON conversation_reset_requests
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_expired_reset_requests();
