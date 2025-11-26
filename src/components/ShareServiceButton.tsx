'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ShareServiceButtonProps {
  serviceId: string;
  serviceName: string;
  shareToken?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export default function ShareServiceButton({
  serviceId,
  serviceName,
  shareToken,
  className = '',
  variant = 'outline',
  size = 'sm'
}: ShareServiceButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(shareToken);

  const generateShareLink = async () => {
    if (token) {
      return `${window.location.origin}/share/service/${token}`;
    }

    // Generate token if not exists
    try {
      setLoading(true);
      const response = await fetch(`/api/services/${serviceId}/share-token`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        return `${window.location.origin}/share/service/${data.token}`;
      }
    } catch (error) {
      console.error('Error generating share token:', error);
      toast.error('Failed to generate share link');
    } finally {
      setLoading(false);
    }

    return null;
  };

  const handleShare = async () => {
    const shareLink = await generateShareLink();
    
    if (!shareLink) return;

    // Try native share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: serviceName,
          text: `Apply for ${serviceName} service`,
          url: shareLink
        });
        toast.success('Shared successfully!');
        return;
      } catch (error) {
        // User cancelled or share failed, fall through to copy
      }
    }

    // Fallback to copy to clipboard
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          Loading...
        </>
      ) : copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </>
      )}
    </Button>
  );
}
