-- Fix RLS policies for conversation_participants to prevent infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they're in or creating" ON conversation_participants;

-- Create a simpler policy that allows authenticated users to add participants
CREATE POLICY "Users can add participants to conversations"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also ensure the SELECT policy is correct
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;

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
