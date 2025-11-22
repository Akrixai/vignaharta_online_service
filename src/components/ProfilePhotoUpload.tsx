'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Camera, Upload, X, User } from 'lucide-react';
import { Button } from '@/components/ui/card';
import { showToast } from '@/lib/toast';
import Image from 'next/image';

interface ProfilePhotoUploadProps {
  userId: string;
  currentPhotoUrl?: string | null;
  userName: string;
  onPhotoUpdate: (photoUrl: string | null) => void;
}

export default function ProfilePhotoUpload({
  userId,
  currentPhotoUrl,
  userName,
  onPhotoUpdate
}: ProfilePhotoUploadProps) {
  const { update } = useSession();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showToast.error('Invalid file type', {
        description: 'Only JPEG, PNG, WebP, and GIF images are allowed.'
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error('File too large', {
        description: 'Maximum file size is 5MB.'
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/users/${userId}/profile-photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload photo');
      }

      const result = await response.json();
      setPreviewUrl(result.data.profile_photo_url);
      onPhotoUpdate(result.data.profile_photo_url);
      
      showToast.success('Profile photo updated successfully!');
      
      // Update session with new profile photo and reload
      await update({
        profile_photo_url: result.data.profile_photo_url
      });
      
      // Force page reload to refresh session in sidebar
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Upload error:', error);
      showToast.error('Failed to upload photo', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
      setPreviewUrl(currentPhotoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/users/${userId}/profile-photo`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete photo');
      }

      setPreviewUrl(null);
      onPhotoUpdate(null);
      
      showToast.success('Profile photo removed successfully!');
      
      // Update session to remove profile photo and reload
      await update({
        profile_photo_url: null
      });
      
      // Force page reload to refresh session in sidebar
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Delete error:', error);
      showToast.error('Failed to delete photo', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        {/* Photo Display */}
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-4xl font-bold shadow-xl ring-4 ring-white">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={userName}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16" />
          )}
        </div>

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-8 h-8 text-white" />
        </div>

        {/* Delete Button */}
        {previewUrl && !uploading && !deleting && (
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-colors"
            title="Remove photo"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Loading Spinner */}
        {(uploading || deleting) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || deleting}
        className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="w-4 h-4" />
        <span>{previewUrl ? 'Change Photo' : 'Upload Photo'}</span>
      </button>

      <p className="text-xs text-gray-500 text-center">
        JPG, PNG, WebP or GIF (max 5MB)
      </p>
    </div>
  );
}
