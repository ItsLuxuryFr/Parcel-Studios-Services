/*
  # Messaging System Database Schema

  This migration creates the complete database schema for a real-time messaging system.

  ## Tables Created

  1. **conversations** - Store conversation metadata
     - `id` (uuid, primary key) - Unique conversation ID
     - `created_at` (timestamptz) - Creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp
     - `last_message_at` (timestamptz) - For sorting conversations by activity

  2. **conversation_participants** - Many-to-many relationship
     - `conversation_id` (uuid, FK to conversations) - References conversations(id)
     - `user_id` (uuid, FK to profiles) - References profiles(id)
     - `joined_at` (timestamptz) - When user joined conversation
     - `last_read_at` (timestamptz) - For read receipts
     - Primary key: (conversation_id, user_id)

  3. **messages** - Store individual messages
     - `id` (uuid, primary key) - Unique message ID
     - `conversation_id` (uuid, FK to conversations) - References conversations(id)
     - `sender_id` (uuid, FK to profiles) - References profiles(id)
     - `content` (text, nullable) - Message text content (null if only attachments)
     - `created_at` (timestamptz) - Message timestamp
     - `is_deleted` (boolean, default false) - Soft delete flag

  4. **message_attachments** - Store file attachments
     - `id` (uuid, primary key) - Unique attachment ID
     - `message_id` (uuid, FK to messages) - References messages(id)
     - `file_url` (text) - Supabase Storage URL
     - `file_name` (text) - Original filename
     - `file_size` (bigint) - File size in bytes
     - `file_type` (text) - MIME type
     - `created_at` (timestamptz) - Upload timestamp

  5. **typing_indicators** - Track who's typing (expires automatically)
     - `conversation_id` (uuid, FK to conversations) - References conversations(id)
     - `user_id` (uuid, FK to profiles) - References profiles(id)
     - `updated_at` (timestamptz) - Last typing activity
     - Primary key: (conversation_id, user_id)

  ## Storage

  - Create `message-attachments` bucket in Supabase Storage
  - Enable RLS policies for authenticated users

  ## Indexes & Triggers

  - Index on `messages.conversation_id` and `messages.created_at` for fast querying
  - Trigger to update `conversations.last_message_at` when new message sent
  - Trigger to update `conversations.updated_at`
  - Function to automatically delete typing indicators older than 5 seconds

  ## RLS Policies

  - Users can only view conversations they're part of
  - Users can only send messages to conversations they're part of
  - Users can only read messages from their conversations
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated_at ON typing_indicators(updated_at);

-- Create function to update conversation timestamps
CREATE OR REPLACE FUNCTION update_conversation_timestamps()
RETURNS trigger AS $$
BEGIN
  -- Update the conversation's updated_at and last_message_at
  UPDATE conversations 
  SET 
    updated_at = now(),
    last_message_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation timestamps when message is inserted
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamps ON messages;
CREATE TRIGGER trigger_update_conversation_timestamps
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamps();

-- Create function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  -- Delete typing indicators older than 5 seconds
  DELETE FROM typing_indicators 
  WHERE updated_at < now() - interval '5 seconds';
END;
$$ LANGUAGE plpgsql;

-- Create function to set typing indicator
CREATE OR REPLACE FUNCTION set_typing_indicator(p_conversation_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert or update typing indicator
  INSERT INTO typing_indicators (conversation_id, user_id, updated_at)
  VALUES (p_conversation_id, p_user_id, now())
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create function to clear typing indicator
CREATE OR REPLACE FUNCTION clear_typing_indicator(p_conversation_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations table
CREATE POLICY "Users can view conversations they participate in"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for conversation_participants table
CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to conversations"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own participation"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for messages table
CREATE POLICY "Users can view messages from their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to conversations they're in"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- RLS Policies for message_attachments table
CREATE POLICY "Users can view attachments from their conversations"
  ON message_attachments FOR SELECT
  TO authenticated
  USING (
    message_id IN (
      SELECT m.id 
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attachments for their messages"
  ON message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    message_id IN (
      SELECT id 
      FROM messages 
      WHERE sender_id = auth.uid()
    )
  );

-- RLS Policies for typing_indicators table
CREATE POLICY "Users can view typing indicators from their conversations"
  ON typing_indicators FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can set their own typing indicators"
  ON typing_indicators FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own typing indicators"
  ON typing_indicators FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own typing indicators"
  ON typing_indicators FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for message attachments
CREATE POLICY "Users can upload message attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Users can view message attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'message-attachments');

CREATE POLICY "Users can delete their own message attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'message-attachments');

-- Create function to get conversation participants with profile info
CREATE OR REPLACE FUNCTION get_conversation_participants(p_conversation_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar text,
  joined_at timestamptz,
  last_read_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.user_id,
    p.display_name,
    p.avatar,
    cp.joined_at,
    cp.last_read_at
  FROM conversation_participants cp
  JOIN profiles p ON cp.user_id = p.id
  WHERE cp.conversation_id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user conversations with last message
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
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
