'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@/types';
import { Phone, Mail, MapPin, Clock, MessageCircle, HelpCircle } from 'lucide-react';
import SupportOptions from '@/components/SupportOptions';

interface ContactConfig {
  company_name: string;
  company_tagline: string;
  contact_email: string;
  support_email: string;
  technical_email: string;
  contact_phone: string;
  contact_phone_secondary: string;
  contact_whatsapp: string;
  whatsapp_support_number: string;
  office_address: string;
  office_address_full: string;
  office_hours: string;
  support_hours: string;
  support_status: string;
  support_response_time: string;
  whatsapp_support_enabled: string;
  email_support_enabled: string;
  support_faqs: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
  order: number;
}

export default function HelpSupportPage() {
  const { data: session } = useSession();
  const [contactConfig, setContactConfig] = useState<ContactConfig | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contact configuration from database
  useEffect(() => {
    const fetchContactConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/contact-config');
        const result = await response.json();
        
        if (result.success && result.data) {
          setContactConfig(result.data);
          
          // Parse FAQs if available
          if (result.data.support_faqs) {
            try {
              const parsedFaqs = JSON.parse(result.data.support_faqs);
              setFaqs(parsedFaqs.sort((a: FAQ, b: FAQ) => a.order - b.order));
            } catch (e) {
              console.error('Error parsing FAQs:', e);
              setFaqs([]);
            }
          }
        } else {
          setError('Failed to load contact configuration');
        }
      } catch (err) {
        console.error('Error fetching contact config:', err);
        setError('Failed to load contact configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchContactConfig();
  }, []);

  // Check access - Allow both retailers and customers
  if (!session || (session.user.role !== UserRole.RETAILER && session.user.role !== UserRole.CUSTOMER)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only retailers and customers can access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading support information...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !contactConfig) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Failed to load support information'}</p>
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
                {contactConfig.company_tagline}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-sm text-red-100">Support Status</div>
                <div className="text-2xl font-bold">{contactConfig.support_status}</div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4 text-red-100">
            <span>🕒 {contactConfig.support_hours}</span>
            <span>•</span>
            {contactConfig.whatsapp_support_enabled === 'true' && (
              <>
                <span>📞 WhatsApp Support</span>
                <span>•</span>
              </>
            )}
            {contactConfig.email_support_enabled === 'true' && (
              <span>📧 Email Support</span>
            )}
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
                <p className="text-sm text-gray-600">{contactConfig.contact_phone}</p>
                <p className="text-xs text-gray-500">{contactConfig.support_hours}</p>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Email Support</p>
                <p className="text-sm text-gray-600">{contactConfig.support_email}</p>
                <p className="text-xs text-gray-500">Response within {contactConfig.support_response_time}</p>
              </div>

              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Office Address</p>
                <p className="text-sm text-gray-600">{contactConfig.company_name}</p>
                <p className="text-xs text-gray-500">{contactConfig.office_address}</p>
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
              {faqs.length > 0 ? (
                faqs.map((faq, index) => {
                  const borderColors = ['border-red-500', 'border-blue-500', 'border-green-500', 'border-yellow-500', 'border-purple-500'];
                  const borderColor = borderColors[index % borderColors.length];
                  
                  return (
                    <div key={index} className={`border-l-4 ${borderColor} pl-4`}>
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-sm text-gray-600">
                        {faq.answer.replace('{contact_whatsapp}', contactConfig.contact_whatsapp)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No FAQs available at the moment.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

  {/* Akrix Solutions Branding */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">🤖</span>
                <span className="font-bold text-gray-900">Powered by Akrix Solutions</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Advanced AI-powered support system for enhanced customer experience
              </p>
              <a
                href="https://akrixsolutions.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors"
              >
                🌐 Visit Akrix Solutions
                <span className="text-xs">↗</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
