'use client';

import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types';
import { Phone, Mail, MapPin, Clock, MessageCircle, HelpCircle } from 'lucide-react';

export default function HelpSupportPage() {
  const { data: session } = useSession();

  // Check retailer access
  if (!session || session.user.role !== UserRole.RETAILER) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">🆘 Help & Support</h1>
          <p className="text-red-100">Get help and support for your account</p>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-600" />
                Contact Information
              </CardTitle>
              <CardDescription>Reach out to us through these channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">Phone Support</p>
                  <p className="text-sm text-gray-600">+91 98765 43210</p>
                  <p className="text-xs text-gray-500">Available 24/7</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">Email Support</p>
                  <p className="text-sm text-gray-600">support@vignahartajanseva.gov.in</p>
                  <p className="text-xs text-gray-500">Response within 24 hours</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">Office Address</p>
                  <p className="text-sm text-gray-600">
                    Vignaharta Online Service Center<br />
                    Government Building, Main Road<br />
                    District Office, State - 123456
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Office Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                Office Hours
              </CardTitle>
              <CardDescription>When you can reach us</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-gray-900">Monday - Friday</span>
                  <span className="text-sm text-gray-600">9:00 AM - 6:00 PM</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium text-gray-900">Saturday</span>
                  <span className="text-sm text-gray-600">10:00 AM - 4:00 PM</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Sunday</span>
                  <span className="text-sm text-gray-600">Closed</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <HelpCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">Emergency Support</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  For urgent issues, call our 24/7 helpline: +91 98765 43210
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-red-600" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Common questions and answers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">How do I check my application status?</h4>
                <p className="text-sm text-gray-600">
                  Go to the Applications section in your dashboard to view the status of all your submitted applications.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">How do I add money to my wallet?</h4>
                <p className="text-sm text-gray-600">
                  Visit the Wallet section and click on "Add Money" to recharge your wallet using various payment methods.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">What documents do I need for services?</h4>
                <p className="text-sm text-gray-600">
                  Required documents vary by service. Check the service details page for specific document requirements.
                </p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">How do I download my certificates?</h4>
                <p className="text-sm text-gray-600">
                  Completed certificates can be downloaded from the Applications section once your application is approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
