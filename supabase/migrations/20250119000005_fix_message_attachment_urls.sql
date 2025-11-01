-- Fix existing message attachment URLs
-- This migration ensures all URLs are proper public URLs

-- Update any message attachments that have file paths to use public URLs
UPDATE message_attachments 
SET file_url = 
  CASE 
    WHEN file_url NOT LIKE 'http%' AND file_url LIKE '%/%' THEN
      -- Convert file path to public URL - we'll use a placeholder that will be replaced
      'SUPABASE_URL_PLACEHOLDER/storage/v1/object/public/message-attachments/' || file_url
    WHEN file_url LIKE '%/public/message-attachments/%' THEN
      -- Already a public URL, keep as is
      file_url
    ELSE
      file_url
  END
WHERE file_url NOT LIKE 'http%' OR file_url LIKE '%/public/message-attachments/%';

-- Add a comment to clarify the change
COMMENT ON COLUMN message_attachments.file_url IS 'Public URL to the file in storage bucket';
