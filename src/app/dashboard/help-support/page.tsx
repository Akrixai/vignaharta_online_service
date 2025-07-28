'use client';

import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types';
import { Phone, Mail, MapPin, Clock, MessageCircle, HelpCircle } from 'lucide-react';
import SupportOptions from '@/components/SupportOptions';

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
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center">
                <HelpCircle className="w-10 h-10 mr-3" />
                Help & Support
              </h1>
              <p className="text-red-100 text-xl">
                Get instant assistance through email or WhatsApp support
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-sm text-red-100">Support Status</div>
                <div className="text-2xl font-bold">ONLINE</div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4 text-red-100">
            <span>🕒 Available Mon-Sat, 9 AM - 6 PM</span>
            <span>•</span>
            <span>📞 WhatsApp Support</span>
            <span>•</span>
            <span>📧 Email Support</span>
          </div>
        </div>

        {/* Support Options */}
        <SupportOptions />

        {/* Quick Contact Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-600" />
              Quick Contact Information
            </CardTitle>
            <CardDescription>Alternative contact methods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Phone className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Phone Support</p>
                <p className="text-sm text-gray-600">+91-7499116527</p>
                <p className="text-xs text-gray-500">Mon-Sat, 9 AM - 6 PM</p>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Email Support</p>
                <p className="text-sm text-gray-600">vighnahartaenterprises.sangli@gmail.com</p>
                <p className="text-xs text-gray-500">Response within 24 hours</p>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Office Address</p>
                <p className="text-sm text-gray-600">Vignaharta Online Service</p>
                <p className="text-xs text-gray-500">Sangli, Maharashtra</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-red-600" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Common questions and answers for retailers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">How do I get support through WhatsApp?</h4>
                <p className="text-sm text-gray-600">
                  Click the "Open WhatsApp Support" button above to send a pre-formatted message to our support team at +91-7499116527.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">How do I send an email query?</h4>
                <p className="text-sm text-gray-600">
                  Use the email support form above to send detailed queries. You'll receive a professional response within 24 hours.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">What support hours are available?</h4>
                <p className="text-sm text-gray-600">
                  Our support team is available Monday to Saturday, 9 AM to 6 PM. Email support is available 24/7.
                </p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold text-gray-900 mb-2">What types of issues can I get help with?</h4>
                <p className="text-sm text-gray-600">
                  Service applications, wallet/payment issues, document queries, technical support, and general questions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Akrix AI Branding */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🤖</span>
                <span className="font-bold text-gray-900">Powered by Akrix AI</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Advanced AI-powered support system for enhanced customer experience
              </p>
              <a
                href="https://akrix-ai.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors"
              >
                🌐 Visit Akrix AI
                <span className="text-xs">↗</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
