-- Create message-attachments storage bucket if it doesn't exist
-- This migration ensures the bucket exists and is properly configured

-- Create the storage bucket for message attachments (similar to commission-completions)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true, -- Public read access (like commission-completions)
  10485760, -- 10MB file size limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'application/json',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'application/json',
    'text/csv'
  ];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete message attachments" ON storage.objects;

-- Create storage policies for message attachments
CREATE POLICY "Allow public read access to message attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'message-attachments');

CREATE POLICY "Allow authenticated users to upload message attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Allow authenticated users to delete message attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments');

-- Add a comment to clarify the change
COMMENT ON COLUMN message_attachments.file_url IS 'Public URL to the file in storage bucket';
