import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { validateImageFile, uploadAvatar, deleteAvatar } from '../lib/imageUpload';

interface ImageUploadProps {
  currentAvatarUrl?: string;
  userId: string;
  onUploadComplete: (url: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  currentAvatarUrl,
  userId,
  onUploadComplete,
  onError,
  disabled = false,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    try {
      validateImageFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
    }
  }, [onError]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setError(null);

    try {
      // Delete old avatar if exists
      if (currentAvatarUrl) {
        await deleteAvatar(userId, currentAvatarUrl);
      }

      // Upload new avatar
      const url = await uploadAvatar(userId, selectedFile);
      onUploadComplete(url);
      
      // Keep preview visible
      setSelectedFile(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload image';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const displayImage = previewUrl || currentAvatarUrl;
  const showUploadButton = selectedFile && !isUploading;

  return (
    <div className="space-y-4">
      {/* Image Preview/Upload Area */}
      <div
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          relative w-32 h-32 rounded-full mx-auto border-2 border-dashed
          ${displayImage ? 'border-transparent' : 'border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-purple-500'}
          transition-colors flex items-center justify-center overflow-hidden
        `}
        onClick={() => {
          if (!disabled && !displayImage && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt="Avatar preview"
              className="w-full h-full object-cover rounded-full"
            />
            {!disabled && !isUploading && (
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"
                    title="Change image"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Click or drop image</p>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />


      {/* Upload button */}
      {showUploadButton && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload Image</span>
            </>
          )}
        </button>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          {error}
        </div>
      )}

      {/* File info */}
      {selectedFile && !error && (
        <div className="text-xs text-gray-400 text-center">
          {(selectedFile.size / 1024).toFixed(1)} KB
        </div>
      )}
    </div>
  );
}

