/*
  # Setup Commission Completion Files Storage

  This migration sets up the Supabase Storage bucket and RLS policies for commission completion files.

  ## Storage Bucket

  - `commission-completions` - Stores files uploaded when projects are completed
  - Organized by commission ID: `{commission_id}/{timestamp}.{extension}`

  ## RLS Policies

  - Authenticated users can read files (for downloading completion files)
  - Only admins can upload files (for project completion)
  - Files are organized by commission ID for better organization

  ## File Organization

  - Path format: `{commission_id}/{timestamp}.{extension}`
  - Example: `123e4567-e89b-12d3-a456-426614174000/1705123456789.pdf`
  - This ensures files are organized and prevents conflicts
*/

-- Create the storage bucket for commission completion files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'commission-completions',
  'commission-completions',
  true, -- Public read access
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
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow authenticated users to read completion files
CREATE POLICY "Allow authenticated users to read completion files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'commission-completions');

-- RLS Policy: Allow admins to upload completion files
-- This policy checks if the user is an admin by looking up their profile
CREATE POLICY "Allow admins to upload completion files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'commission-completions' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- RLS Policy: Allow admins to update completion files
CREATE POLICY "Allow admins to update completion files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'commission-completions' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- RLS Policy: Allow admins to delete completion files
CREATE POLICY "Allow admins to delete completion files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'commission-completions' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Note: Storage bucket 'commission-completions' created for commission completion files
-- This bucket stores files uploaded by admins when projects are completed
