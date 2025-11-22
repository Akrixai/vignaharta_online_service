'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ServiceApplicationForm from '@/components/ServiceApplicationForm';
import { showToast } from '@/lib/toast';

export default function SharedApplicationPage({ params }: { params: { token: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    fetchLinkData();
  }, [params.token, session]);

  const fetchLinkData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shared-application/${params.token}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to load application');
        return;
      }

      if (result.requiresLogin) {
        // User needs to login
        setLinkData(result.link);
        setError('Please login to access this application');
        return;
      }

      setLinkData(result.link);
      setShowApplicationForm(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading application...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !linkData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => router.push('/')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && linkData) {
    // User needs to login
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center">
        <Card className="max-w-2xl w-full mx-4">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
            <CardTitle className="text-2xl">🔒 Login Required</CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{linkData.title}</h3>
                {linkData.description && (
                  <p className="text-gray-600">{linkData.description}</p>
                )}
              </div>

              {linkData.scheme && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Service Details</h4>
                  <p className="text-blue-800"><strong>Service:</strong> {linkData.scheme.name}</p>
                  <p className="text-blue-800"><strong>Category:</strong> {linkData.scheme.category}</p>
                </div>
              )}

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-yellow-800">
                  <strong>⚠️ Authentication Required:</strong> You need to login to access this application form.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => router.push(`/login?callbackUrl=/apply/${params.token}`)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  🔐 Login to Continue
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  variant="outline"
                  className="flex-1"
                >
                  📝 Register
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
            <CardTitle className="text-2xl">📋 {linkData.title}</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            {linkData.description && (
              <p className="text-gray-600 mb-4">{linkData.description}</p>
            )}
            {linkData.scheme && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Service Information</h4>
                <p className="text-green-800"><strong>Service:</strong> {linkData.scheme.name}</p>
                <p className="text-green-800"><strong>Category:</strong> {linkData.scheme.category}</p>
                {linkData.scheme.description && (
                  <p className="text-green-700 mt-2">{linkData.scheme.description}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {showApplicationForm && linkData.scheme && (
          <ServiceApplicationForm
            service={linkData.scheme}
            isOpen={true}
            onClose={() => router.push('/dashboard')}
            onSuccess={() => {
              showToast.success('Application submitted successfully!');
              router.push('/dashboard/applications');
            }}
          />
        )}
      </div>
    </div>
  );
}
