import { 
  File, 
  FileText, 
  Image, 
  Music, 
  Video, 
  Archive, 
  Download,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FilePresentation,
  FileType
} from 'lucide-react';

/**
 * Format a timestamp to relative time (e.g., "5 min ago", "2 hours ago")
 */
export function formatTimestamp(date: string | Date): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hr ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number | undefined | null): string {
  if (!bytes || bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get appropriate icon for file type
 */
export function getFileIcon(fileType: string): React.ComponentType<{ className?: string }> {
  const mimeType = fileType.toLowerCase();
  
  if (mimeType.startsWith('image/')) {
    return FileImage;
  }
  
  if (mimeType.startsWith('video/')) {
    return FileVideo;
  }
  
  if (mimeType.startsWith('audio/')) {
    return FileAudio;
  }
  
  if (mimeType.includes('pdf')) {
    return FileType;
  }
  
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
    return FileArchive;
  }
  
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return FileText;
  }
  
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return FileText;
  }
  
  if (mimeType.includes('javascript') || mimeType.includes('typescript') || 
      mimeType.includes('python') || mimeType.includes('java') || 
      mimeType.includes('html') || mimeType.includes('css') ||
      mimeType.includes('json') || mimeType.includes('xml')) {
    return FileCode;
  }
  
  if (mimeType.includes('text/')) {
    return FileText;
  }
  
  // Default file icon
  return File;
}

/**
 * Truncate message text for preview
 */
export function truncateMessage(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Check if a file type is an image
 */
export function isImageFile(fileType: string | undefined): boolean {
  if (!fileType) return false;
  return fileType.toLowerCase().startsWith('image/');
}

/**
 * Check if a file type is a video
 */
export function isVideoFile(fileType: string | undefined): boolean {
  if (!fileType) return false;
  return fileType.toLowerCase().startsWith('video/');
}

/**
 * Check if a file type is an audio file
 */
export function isAudioFile(fileType: string | undefined): boolean {
  if (!fileType) return false;
  return fileType.toLowerCase().startsWith('audio/');
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is too large for upload
 */
export function isFileTooLarge(fileSize: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize > maxSizeBytes;
}

/**
 * Generate a unique filename to prevent conflicts
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  
  return `${nameWithoutExt}_${timestamp}_${randomString}.${extension}`;
}

/**
 * Format conversation title (for group chats or 1-on-1)
 */
export function formatConversationTitle(
  participants: Array<{ displayName: string; userId: string }>,
  currentUserId: string,
  nickname?: string | null
): string {
  if (nickname && nickname.trim()) {
    return nickname.trim();
  }
  const otherParticipants = participants.filter(p => p.userId !== currentUserId);
  
  if (otherParticipants.length === 0) {
    return 'You';
  }
  
  if (otherParticipants.length === 1) {
    return otherParticipants[0].displayName;
  }
  
  if (otherParticipants.length === 2) {
    return `${otherParticipants[0].displayName}, ${otherParticipants[1].displayName}`;
  }
  
  return `${otherParticipants[0].displayName} +${otherParticipants.length - 1} others`;
}

/**
 * Check if user is currently online (within last 5 minutes)
 */
export function isUserOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
  
  return diffInMinutes <= 5;
}

/**
 * Format message content for display (handle line breaks, etc.)
 */
export function formatMessageContent(content: string | null): string {
  if (!content) return '';
  
  // Convert line breaks to <br> tags for display
  return content.replace(/\n/g, '<br>');
}

/**
 * Extract mentions from message content
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Highlight mentions in message content
 */
export function highlightMentions(content: string, currentUserId: string): string {
  return content.replace(
    /@(\w+)/g, 
    (match, username) => {
      // You could add logic here to check if the mention is valid
      return `<span class="text-purple-400 font-medium">${match}</span>`;
    }
  );
}
