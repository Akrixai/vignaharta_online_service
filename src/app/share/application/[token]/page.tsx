'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Download, Eye, CheckCircle, Clock, FileText } from 'lucide-react';
import jsPDF from 'jspdf';

export default function SharedApplicationPage() {
  const params = useParams();
  const token = params.token as string;
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [token]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/share/application/${token}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setApplication(result.data);
      } else {
        setError(result.error || 'Failed to load application');
      }
    } catch (err) {
      setError('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!application) return;

    setDownloading(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPos = 20;

      // Add page numbers and branding footer function
      const addFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 15;
        
        // Decorative line
        pdf.setDrawColor(220, 38, 38);
        pdf.setLineWidth(0.5);
        pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5);
        
        // Page number
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Page ${pageNum} of ${totalPages}`, 20, footerY);
        
        // Powered by Akrix Solutions with link
        pdf.setTextColor(220, 38, 38);
        pdf.setFont('helvetica', 'bold');
        const poweredByText = 'Powered by Akrix Solutions';
        const textWidth = pdf.getTextWidth(poweredByText);
        const linkX = pageWidth - 20 - textWidth;
        pdf.textWithLink(poweredByText, linkX, footerY, { url: 'https://akrixsolutions.in' });
      };

      // Enhanced Header with gradient effect
      // Top gradient bar (dark red to light red)
      pdf.setFillColor(185, 28, 28); // Dark red
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setFillColor(220, 38, 38); // Medium red
      pdf.rect(0, 15, pageWidth, 15, 'F');
      pdf.setFillColor(239, 68, 68); // Light red
      pdf.rect(0, 30, pageWidth, 10, 'F');

      // Decorative corner elements
      pdf.setFillColor(255, 255, 255);
      pdf.circle(10, 10, 3, 'F');
      pdf.circle(pageWidth - 10, 10, 3, 'F');

      // Company Name/Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Vighnaharta Online Services', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Application Details Report', pageWidth / 2, 30, { align: 'center' });

      // Decorative line under header
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.5);
      pdf.line(40, 35, pageWidth - 40, 35);

      yPos = 50;

      // Application Status Badge with icon
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      
      let statusColor;
      if (application.status === 'APPROVED') {
        statusColor = [34, 197, 94]; // Green
      } else if (application.status === 'PENDING') {
        statusColor = [234, 179, 8]; // Yellow
      } else {
        statusColor = [239, 68, 68]; // Red
      }
      
      pdf.setFillColor(...statusColor);
      pdf.roundedRect(pageWidth - 55, yPos - 5, 45, 12, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text(application.status, pageWidth - 32.5, yPos + 3, { align: 'center' });

      // Document ID and Date box
      pdf.setFillColor(243, 244, 246); // Light gray
      pdf.roundedRect(20, yPos - 5, pageWidth - 75, 12, 2, 2, 'F');
      pdf.setTextColor(75, 85, 99);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Document ID: ${application.id.slice(0, 13)}... | Generated: ${new Date().toLocaleDateString()}`, 25, yPos + 3);

      yPos += 20;

      // Service Information Section with colored background
      pdf.setFillColor(239, 246, 255); // Light blue background
      pdf.roundedRect(15, yPos - 5, pageWidth - 30, 35, 3, 3, 'F');
      
      // Section icon and title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(37, 99, 235); // Blue
      pdf.text('SERVICE INFORMATION', 20, yPos + 2);
      
      yPos += 12;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      if (application.scheme) {
        // Service details in a grid-like format
        pdf.setFont('helvetica', 'bold');
        pdf.text('Service Name:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        const serviceName = pdf.splitTextToSize(application.scheme.name, pageWidth - 90);
        pdf.text(serviceName, 70, yPos);
        yPos += 6 * serviceName.length;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Category:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(application.scheme.category || 'N/A', 70, yPos);
        yPos += 6;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Amount:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(220, 38, 38); // Red for amount
        pdf.setFont('helvetica', 'bold');
        pdf.text(formatCurrency(application.amount || 0), 70, yPos);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        yPos += 6;
      }
      
      yPos += 8;

      // Customer Information Section with colored background
      pdf.setFillColor(240, 253, 244); // Light green background
      pdf.roundedRect(15, yPos - 5, pageWidth - 30, 40, 3, 3, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(22, 163, 74); // Green
      pdf.text('CUSTOMER INFORMATION', 20, yPos + 2);
      
      yPos += 12;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Name:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(application.customer_name, 70, yPos);
      yPos += 6;

      if (application.customer_phone) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Phone:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(application.customer_phone, 70, yPos);
        yPos += 6;
      }

      if (application.customer_email) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Email:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(application.customer_email, 70, yPos);
        yPos += 6;
      }

      if (application.customer_address) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Address:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        const addressLines = pdf.splitTextToSize(application.customer_address, pageWidth - 90);
        pdf.text(addressLines, 70, yPos);
        yPos += 6 * addressLines.length;
      }

      yPos += 8;

      // Application Timeline Section
      pdf.setFillColor(254, 243, 199); // Light yellow background
      pdf.roundedRect(15, yPos - 5, pageWidth - 30, 30, 3, 3, 'F');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(217, 119, 6); // Orange
      pdf.text('APPLICATION TIMELINE', 20, yPos + 2);
      
      yPos += 12;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Submitted:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formatDateTime(application.created_at), 70, yPos);
      yPos += 6;

      if (application.processed_at) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Processed:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatDateTime(application.processed_at), 70, yPos);
        yPos += 6;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text('Submitted By:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(application.submitted_by?.name || 'N/A', 70, yPos);
      yPos += 8;

      yPos += 5;

      // Form Data
      if (application.form_data && typeof application.form_data === 'object') {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = 20;
        }

        // Form Data Section Header
        pdf.setFillColor(243, 232, 255); // Light purple background
        pdf.roundedRect(15, yPos - 5, pageWidth - 30, 12, 3, 3, 'F');
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(147, 51, 234); // Purple
        pdf.text('APPLICATION FORM DATA', 20, yPos + 2);
        yPos += 15;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        Object.entries(application.form_data).forEach(([key, value]) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }

          // Get user-friendly label for dynamic fields
          let displayLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          // Check if this is a dynamic field and get its label from scheme
          if (key.startsWith('dynamic_field_') && application.scheme?.dynamic_fields) {
            const fieldId = key.replace('dynamic_', '');
            const field = application.scheme.dynamic_fields.find((f: any) => f.id === fieldId);
            if (field) {
              displayLabel = field.label;
            }
          }

          // Handle service_specific_data object
          if (key === 'service_specific_data' && typeof value === 'object' && value !== null) {
            // Add section header with background
            pdf.setFillColor(219, 234, 254); // Light blue
            pdf.roundedRect(18, yPos - 3, pageWidth - 36, 10, 2, 2, 'F');
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(37, 99, 235);
            pdf.text('SERVICE SPECIFIC INFORMATION', 22, yPos + 3);
            yPos += 12;
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);

            Object.entries(value).forEach(([subKey, subValue]) => {
              if (yPos > pageHeight - 20) {
                pdf.addPage();
                yPos = 20;
              }

              let subLabel = subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              // Get label for dynamic fields inside service_specific_data
              if (subKey.startsWith('dynamic_field_') && application.scheme?.dynamic_fields) {
                const fieldId = subKey.replace('dynamic_', '');
                const field = application.scheme.dynamic_fields.find((f: any) => f.id === fieldId);
                if (field) {
                  subLabel = field.label;
                }
              }

              pdf.setFont('helvetica', 'bold');
              pdf.text(`${subLabel}:`, 20, yPos);
              pdf.setFont('helvetica', 'normal');
              
              const subDisplayValue = String(subValue || 'N/A');
              const subValueLines = pdf.splitTextToSize(subDisplayValue, pageWidth - 90);
              pdf.text(subValueLines, 70, yPos);
              yPos += 6 * subValueLines.length;
            });
            return;
          }

          pdf.setFont('helvetica', 'bold');
          pdf.text(`${displayLabel}:`, 20, yPos);
          pdf.setFont('helvetica', 'normal');
          
          let displayValue = 'N/A';
          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              displayValue = value.join(', ');
            } else {
              displayValue = JSON.stringify(value, null, 2);
            }
          } else {
            displayValue = String(value || 'N/A');
          }

          const valueLines = pdf.splitTextToSize(displayValue, pageWidth - 90);
          pdf.text(valueLines, 70, yPos);
          yPos += 6 * valueLines.length;
        });
      }

      // Count total pages (we'll add footer to all pages)
      const totalPages = pdf.getNumberOfPages();
      
      // Add footer to all pages
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i, totalPages);
      }

      // Add metadata
      pdf.setProperties({
        title: `Application - ${application.customer_name}`,
        subject: `${application.scheme?.name || 'Service'} Application`,
        author: 'Vighnaharta Online Services',
        keywords: 'application, government services, vighnaharta',
        creator: 'Powered by Akrix Solutions'
      });

      // Save PDF with professional filename
      const fileName = `Application_${application.customer_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading application...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-5 h-5" />;
      case 'PENDING': return <Clock className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Shared Application</h1>
              <p className="text-red-100 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Viewed {application.share_view_count || 0} times
              </p>
            </div>
            <Button
              onClick={downloadPDF}
              disabled={downloading}
              className="bg-red-600 text-white hover:bg-red-700 font-semibold shadow-lg"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Status Badge */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getStatusColor(application.status)}`}>
            {getStatusIcon(application.status)}
            <span className="font-semibold">{application.status}</span>
          </div>
        </div>

        {/* Service Information */}
        {application.scheme && (
          <Card className="mb-6 shadow-lg border-l-4 border-l-red-500">
            <CardHeader className="bg-gradient-to-r from-red-50 to-white">
              <CardTitle className="text-2xl text-red-700">Service Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service Name</label>
                  <p className="text-lg font-semibold text-gray-900">{application.scheme.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-lg font-semibold text-gray-900">{application.scheme.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(application.amount || 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Processing Time</label>
                  <p className="text-lg font-semibold text-gray-900">{application.scheme.processing_time_days} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Information */}
        <Card className="mb-6 shadow-lg border-l-4 border-l-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
            <CardTitle className="text-2xl text-blue-700">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-lg font-semibold text-gray-900">{application.customer_name}</p>
              </div>
              {application.customer_phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="text-lg font-semibold text-gray-900">{application.customer_phone}</p>
                </div>
              )}
              {application.customer_email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email Address</label>
                  <p className="text-lg font-semibold text-gray-900">{application.customer_email}</p>
                </div>
              )}
              {application.customer_address && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-lg font-semibold text-gray-900">{application.customer_address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Application Timeline */}
        <Card className="mb-6 shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white">
            <CardTitle className="text-2xl text-green-700">Application Timeline</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Submitted On</label>
                <p className="text-lg font-semibold text-gray-900">{formatDateTime(application.created_at)}</p>
              </div>
              {application.processed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Processed On</label>
                  <p className="text-lg font-semibold text-gray-900">{formatDateTime(application.processed_at)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Submitted By</label>
                <p className="text-lg font-semibold text-gray-900">{application.submitted_by?.name || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Data */}
        {application.form_data && typeof application.form_data === 'object' && (
          <Card className="mb-6 shadow-lg border-l-4 border-l-purple-500">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
              <CardTitle className="text-2xl text-purple-700">Application Form Data</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Object.entries(application.form_data).map(([key, value]) => {
                  // Get user-friendly label for dynamic fields
                  let displayLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  
                  // Check if this is a dynamic field and get its label from scheme
                  if (key.startsWith('dynamic_field_') && application.scheme?.dynamic_fields) {
                    const fieldId = key.replace('dynamic_', '');
                    const field = application.scheme.dynamic_fields.find((f: any) => f.id === fieldId);
                    if (field) {
                      displayLabel = field.label;
                    }
                  }

                  // Handle service_specific_data object
                  if (key === 'service_specific_data' && typeof value === 'object' && value !== null) {
                    return (
                      <div key={key} className="space-y-3">
                        <h4 className="text-lg font-semibold text-purple-700 border-b border-purple-200 pb-2">
                          Service Specific Information
                        </h4>
                        {Object.entries(value).map(([subKey, subValue]) => {
                          let subLabel = subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          
                          // Get label for dynamic fields inside service_specific_data
                          if (subKey.startsWith('dynamic_field_') && application.scheme?.dynamic_fields) {
                            const fieldId = subKey.replace('dynamic_', '');
                            const field = application.scheme.dynamic_fields.find((f: any) => f.id === fieldId);
                            if (field) {
                              subLabel = field.label;
                            }
                          }

                          return (
                            <div key={subKey} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <label className="text-sm font-medium text-gray-600">
                                {subLabel}
                              </label>
                              <p className="text-base font-semibold text-gray-900 mt-1">
                                {String(subValue || 'N/A')}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <label className="text-sm font-medium text-gray-600">
                        {displayLabel}
                      </label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {(() => {
                          if (typeof value === 'object' && value !== null) {
                            if (Array.isArray(value)) {
                              return value.join(', ');
                            }
                            return JSON.stringify(value, null, 2);
                          }
                          return String(value || 'N/A');
                        })()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Notes */}
        {application.notes && (
          <Card className="mb-6 shadow-lg border-l-4 border-l-orange-500">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white">
              <CardTitle className="text-2xl text-orange-700">Admin Notes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-base text-gray-900 whitespace-pre-wrap">{application.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>This is a shared application view. The information displayed is read-only.</p>
          <p className="mt-2">Generated on {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
