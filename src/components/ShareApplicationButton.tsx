'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, X, ExternalLink } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface ShareApplicationButtonProps {
  applicationId: string;
  applicationName: string;
  isApproved: boolean;
  shareToken?: string;
  shareEnabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onShareStatusChange?: () => void;
}

export default function ShareApplicationButton({
  applicationId,
  applicationName,
  isApproved,
  shareToken: initialToken,
  shareEnabled: initialEnabled,
  className = '',
  variant = 'outline',
  size = 'sm',
  onShareStatusChange
}: ShareApplicationButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareToken, setShareToken] = useState(initialToken);
  const [shareEnabled, setShareEnabled] = useState(initialEnabled);
  const [showModal, setShowModal] = useState(false);

  const generateShareLink = async () => {
    if (!isApproved) {
      showToast.error('Only approved applications can be shared');
      return null;
    }

    if (shareToken && shareEnabled) {
      return `${window.location.origin}/share/application/${shareToken}`;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/applications/${applicationId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 0 }) // 0 = no expiration
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShareToken(result.data.share_token);
        setShareEnabled(true);
        onShareStatusChange?.();
        return result.data.share_url;
      } else {
        showToast.error(result.error || 'Failed to generate share link');
        return null;
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      showToast.error('Failed to generate share link');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const disableShare = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/applications/${applicationId}/share`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShareEnabled(false);
        onShareStatusChange?.();
        showToast.success('Share link disabled successfully');
        setShowModal(false);
      } else {
        showToast.error(result.error || 'Failed to disable share link');
      }
    } catch (error) {
      console.error('Error disabling share:', error);
      showToast.error('Failed to disable share link');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareLink = await generateShareLink();
    
    if (!shareLink) return;

    setShowModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast.error('Failed to copy link');
    }
  };

  const shareViaNavigator = async (shareLink: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Application - ${applicationName}`,
          text: `View application details for ${applicationName}`,
          url: shareLink
        });
        showToast.success('Shared successfully!');
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    }
  };

  if (!isApproved) {
    return (
      <Button
        disabled
        variant={variant}
        size={size}
        className={className}
        title="Only approved applications can be shared"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
    );
  }

  const shareLink = shareToken && shareEnabled 
    ? `${window.location.origin}/share/application/${shareToken}`
    : null;

  return (
    <>
      <Button
        onClick={handleShare}
        disabled={loading}
        variant={shareEnabled ? 'default' : variant}
        size={size}
        className={`${className} ${shareEnabled ? 'bg-green-600 hover:bg-green-700' : ''}`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Loading...
          </>
        ) : shareEnabled ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Shared
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </>
        )}
      </Button>

      {/* Share Modal */}
      {showModal && shareLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Share Application</h3>
                  <p className="text-green-100">Share this application with anyone via link</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Application Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Application Details</h4>
                <p className="text-green-700">{applicationName}</p>
              </div>

              {/* Share Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(shareLink)}
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Features</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Anyone with the link can view the application
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Viewers can download the application as PDF
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    View count is tracked automatically
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Link remains active until you disable it
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => window.open(shareLink, '_blank')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                {navigator.share && (
                  <Button
                    onClick={() => shareViaNavigator(shareLink)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                )}
                <Button
                  onClick={disableShare}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  {loading ? 'Disabling...' : 'Disable Link'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
