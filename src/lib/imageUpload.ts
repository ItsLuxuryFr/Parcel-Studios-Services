import { supabase } from './supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates an image file before upload
 * @param file - The file to validate
 * @returns true if valid, throws error if invalid
 */
export function validateImageFile(file: File): void {
  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }
}

/**
 * Uploads an avatar image to Supabase Storage
 * @param userId - The user's ID
 * @param file - The image file to upload
 * @returns The public URL of the uploaded image
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  validateImageFile(file);

  // Get file extension
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `avatar.${extension}`;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Replace existing file if it exists
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Deletes an old avatar from Supabase Storage
 * @param userId - The user's ID
 * @param oldUrl - The old avatar URL (optional)
 */
export async function deleteAvatar(userId: string, oldUrl?: string): Promise<void> {
  if (!oldUrl) return;

  // Extract file path from URL
  // URLs are typically: https://project.supabase.co/storage/v1/object/public/avatars/{userId}/avatar.{ext}
  const urlParts = oldUrl.split('/avatars/');
  if (urlParts.length < 2) {
    // If URL doesn't match expected format, try to delete by pattern
    try {
      const fileName = `avatar.jpg`;
      const filePath = `${userId}/${fileName}`;
      await supabase.storage.from('avatars').remove([filePath]);
    } catch (error) {
      console.warn('Could not delete old avatar:', error);
    }
    return;
  }

  const filePath = urlParts[1];
  
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.warn('Error deleting old avatar:', error);
      // Don't throw - deletion failure shouldn't block upload
    }
  } catch (error) {
    console.warn('Could not delete old avatar:', error);
  }
}

