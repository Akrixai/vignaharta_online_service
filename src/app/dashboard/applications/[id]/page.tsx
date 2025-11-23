'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { showToast } from '@/lib/toast';
import { ArrowLeft, FileText, Download } from 'lucide-react';

export default function ApplicationDetailsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session || !applicationId) return;

    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/applications/${applicationId}`);
        const data = await response.json();

        if (data.success) {
          setApplication(data.data);
        } else {
          showToast.error('Failed to load application', {
            description: data.error || 'Unknown error'
          });
        }
      } catch (error) {
        showToast.error('Error loading application', {
          description: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [session, applicationId]);

  if (!session) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-600 border-yellow-300';
      case 'APPROVED': return 'bg-green-100 text-green-600 border-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-600 border-red-300';
      case 'PROCESSING': return 'bg-blue-100 text-blue-600 border-blue-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      case 'PROCESSING': return '🔄';
      default: return '📄';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Applications</span>
        </Button>

        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading application details...</p>
            </CardContent>
          </Card>
        ) : !application ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Application Not Found</h3>
              <p className="text-gray-600">The application you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {application.schemes?.name || application.service_name || 'Application Details'}
                  </h1>
                  <p className="text-red-100">Application ID: {application.id}</p>
                </div>
                <div className={`px-4 py-2 rounded-full border-2 ${getStatusColor(application.status)}`}>
                  <span className="font-bold">
                    {getStatusIcon(application.status)} {application.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>👤 Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg font-semibold">{application.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-lg font-semibold">{application.customer_phone}</p>
                  </div>
                  {application.customer_email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-lg font-semibold">{application.customer_email}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-lg">{application.customer_address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Service Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service Name</label>
                    <p className="text-lg font-semibold">
                      {application.schemes?.name || application.service_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-lg">{application.schemes?.category || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount Paid</label>
                    <p className="text-lg font-semibold">
                      {application.amount === 0 ? 'FREE' : formatCurrency(application.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Submitted On</label>
                    <p className="text-lg">{formatDateTime(application.created_at)}</p>
                  </div>
                  {application.processed_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Processed On</label>
                      <p className="text-lg">{formatDateTime(application.processed_at)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form Data */}
            {application.form_data && Object.keys(application.form_data).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>📝 Application Form Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(application.form_data).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-sm font-medium text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <p className="text-lg">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {application.documents && application.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>📎 Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {application.documents.map((doc: string, index: number) => (
                      <a
                        key={index}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Document {index + 1}</span>
                        <Download className="w-4 h-4 ml-auto text-gray-400" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Notes */}
            {application.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>💬 Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{application.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>📅 Status Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold">Application Submitted</p>
                      <p className="text-sm text-gray-500">{formatDateTime(application.created_at)}</p>
                    </div>
                  </div>
                  
                  {application.status === 'PROCESSING' && (
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        🔄
                      </div>
                      <div>
                        <p className="font-semibold">Under Processing</p>
                        <p className="text-sm text-gray-500">Being reviewed by admin</p>
                      </div>
                    </div>
                  )}
                  
                  {application.status === 'APPROVED' && application.processed_at && (
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                        ✓
                      </div>
                      <div>
                        <p className="font-semibold">Application Approved</p>
                        <p className="text-sm text-gray-500">{formatDateTime(application.processed_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {application.status === 'REJECTED' && application.processed_at && (
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                        ✗
                      </div>
                      <div>
                        <p className="font-semibold">Application Rejected</p>
                        <p className="text-sm text-gray-500">{formatDateTime(application.processed_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
