-- Make message-attachments bucket public like commission-completions
-- This will allow using public URLs for downloads, making it consistent with the commission system

-- Update the storage bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'message-attachments';

-- Update storage policies to allow public read access
DROP POLICY IF EXISTS "Users can view message attachments" ON storage.objects;

CREATE POLICY "Allow public read access to message attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'message-attachments');

-- Keep the existing upload policy for authenticated users
DROP POLICY IF EXISTS "Users can upload message attachments" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload message attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

-- Keep the existing delete policy for authenticated users
DROP POLICY IF EXISTS "Users can delete their own message attachments" ON storage.objects;

CREATE POLICY "Allow authenticated users to delete message attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments');

-- Add a comment to clarify the change
COMMENT ON COLUMN message_attachments.file_url IS 'Public URL to the file in storage bucket';
