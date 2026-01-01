'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast';

interface ServiceImageUploadProps {
  serviceId?: string;
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  disabled?: boolean;
}

export default function ServiceImageUpload({
  serviceId,
  currentImageUrl,
  onImageChange,
  disabled = false
}: ServiceImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast.error('Invalid file type', {
        description: 'Please select an image file (JPG, PNG, GIF, WebP)'
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast.error('File too large', {
        description: 'Please select an image smaller than 10MB'
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    if (serviceId) {
      await uploadImage(file);
    } else {
      // For new services, just update the preview and let parent handle the file
      onImageChange(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('serviceId', serviceId!);

      const response = await fetch('/api/admin/services/images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPreviewUrl(data.url);
        onImageChange(data.url);
        showToast.success('Image uploaded successfully!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
      // Reset preview on error
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!serviceId || !currentImageUrl) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/services/images?serviceId=${serviceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setPreviewUrl(null);
        onImageChange(null);
        showToast.success('Image deleted successfully!');
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast.error('Delete failed', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleRemovePreview = () => {
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-red-700 mb-2">
        Service Image
      </label>

      {previewUrl ? (
        <div className="relative group">
          <div className="relative h-48 w-full overflow-hidden rounded-lg border-2 border-gray-200">
            <img
              src={previewUrl}
              alt="Service preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
          </div>
          
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="bg-white/90 hover:bg-white border-gray-300"
            >
              <Upload className="w-4 h-4" />
            </Button>
            
            {serviceId && currentImageUrl ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDeleteImage}
                disabled={disabled || deleting}
                className="bg-red-500/90 hover:bg-red-600 text-white border-red-500"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRemovePreview}
                disabled={disabled}
                className="bg-red-500/90 hover:bg-red-600 text-white border-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600/50 border-t-red-600" />
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ImageIcon className="w-12 h-12 mb-4 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP up to 10MB</p>
            </div>
          </label>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />

      <p className="text-xs text-gray-500">
        Upload an image that will be displayed to users for this service. 
        Recommended size: 800x600px or larger for best quality.
      </p>
    </div>
  );
}