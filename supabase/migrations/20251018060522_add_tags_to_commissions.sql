/*
  # Add tags support to commissions

  ## Changes
  
  1. Schema Updates
    - Add `tags` column to commissions table as text array
    - Create GIN index on tags column for efficient array searching
    - Add text search index for subject and description columns
  
  2. Performance
    - GIN index enables fast tag lookups and filtering
    - Text search index enables efficient full-text search
  
  ## Notes
  
  - Tags are stored as a PostgreSQL text array
  - Empty array is the default value
  - Indexes will improve query performance for filtering and searching
*/

-- Add tags column to commissions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions' AND column_name = 'tags'
  ) THEN
    ALTER TABLE commissions ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Create GIN index on tags for efficient array searching
CREATE INDEX IF NOT EXISTS idx_commissions_tags ON commissions USING GIN(tags);

-- Create text search index for subject and description
CREATE INDEX IF NOT EXISTS idx_commissions_text_search 
  ON commissions USING GIN(to_tsvector('english', subject || ' ' || description));