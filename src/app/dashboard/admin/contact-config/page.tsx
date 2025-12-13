'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

interface ContactConfig {
  company_name: string;
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
  company_tagline: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
}

export default function ContactConfigPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ContactConfig>({
    company_name: '',
    contact_email: '',
    support_email: '',
    technical_email: '',
    contact_phone: '',
    contact_phone_secondary: '',
    contact_whatsapp: '',
    whatsapp_support_number: '',
    office_address: '',
    office_address_full: '',
    office_hours: '',
    support_hours: '',
    company_tagline: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    linkedin_url: '',
    youtube_url: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contact-config');
      const result = await response.json();
      
      if (result.success && result.data) {
        setConfig(result.data as ContactConfig);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/contact-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Contact configuration updated successfully!');
        fetchConfig();
      } else {
        toast.error(data.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Information Configuration</h1>
          <p className="text-gray-600 mt-1">Manage contact details displayed across the website</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading configuration...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>🏢 Company Information</CardTitle>
                <CardDescription>Basic company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={config.company_name}
                    onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                    placeholder="Vighnaharta Online Services"
                  />
                </div>

                <div>
                  <Label htmlFor="company_tagline">Company Tagline</Label>
                  <Input
                    id="company_tagline"
                    value={config.company_tagline}
                    onChange={(e) => setConfig({ ...config, company_tagline: e.target.value })}
                    placeholder="Your Trusted Partner for Government Services"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle>📞 Contact Details</CardTitle>
                <CardDescription>Phone numbers and email addresses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_phone">Primary Phone</Label>
                    <Input
                      id="contact_phone"
                      value={config.contact_phone}
                      onChange={(e) => setConfig({ ...config, contact_phone: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_phone_secondary">Secondary Phone</Label>
                    <Input
                      id="contact_phone_secondary"
                      value={config.contact_phone_secondary}
                      onChange={(e) => setConfig({ ...config, contact_phone_secondary: e.target.value })}
                      placeholder="+91-7499116527"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_whatsapp">WhatsApp Number (with +)</Label>
                    <Input
                      id="contact_whatsapp"
                      value={config.contact_whatsapp}
                      onChange={(e) => setConfig({ ...config, contact_whatsapp: e.target.value })}
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp_support_number">WhatsApp Support (without +)</Label>
                    <Input
                      id="whatsapp_support_number"
                      value={config.whatsapp_support_number}
                      onChange={(e) => setConfig({ ...config, whatsapp_support_number: e.target.value })}
                      placeholder="917499116527"
                    />
                    <p className="text-xs text-gray-500 mt-1">Used for WhatsApp API links</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contact_email">Primary Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={config.contact_email}
                      onChange={(e) => setConfig({ ...config, contact_email: e.target.value })}
                      placeholder="info@vignahartajanseva.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      value={config.support_email}
                      onChange={(e) => setConfig({ ...config, support_email: e.target.value })}
                      placeholder="support@company.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="technical_email">Technical Email</Label>
                    <Input
                      id="technical_email"
                      type="email"
                      value={config.technical_email}
                      onChange={(e) => setConfig({ ...config, technical_email: e.target.value })}
                      placeholder="tech@company.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address & Hours */}
            <Card>
              <CardHeader>
                <CardTitle>🏠 Address & Working Hours</CardTitle>
                <CardDescription>Office location and timings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="office_address">Office Address (Short)</Label>
                  <Input
                    id="office_address"
                    value={config.office_address}
                    onChange={(e) => setConfig({ ...config, office_address: e.target.value })}
                    placeholder="Main Street, City, State - 123456"
                  />
                </div>

                <div>
                  <Label htmlFor="office_address_full">Office Address (Full)</Label>
                  <Textarea
                    id="office_address_full"
                    value={config.office_address_full}
                    onChange={(e) => setConfig({ ...config, office_address_full: e.target.value })}
                    placeholder="Bajrang Nagar, MIDC Kupwad, Maharashtra 416436, India"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="office_hours">Office Hours</Label>
                    <Input
                      id="office_hours"
                      value={config.office_hours}
                      onChange={(e) => setConfig({ ...config, office_hours: e.target.value })}
                      placeholder="Monday to Saturday, 9:00 AM to 6:00 PM"
                    />
                  </div>

                  <div>
                    <Label htmlFor="support_hours">Support Hours</Label>
                    <Input
                      id="support_hours"
                      value={config.support_hours}
                      onChange={(e) => setConfig({ ...config, support_hours: e.target.value })}
                      placeholder="Mon-Sat: 9:00 AM - 6:00 PM"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>🌐 Social Media Links</CardTitle>
                <CardDescription>Social media profile URLs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facebook_url">Facebook URL</Label>
                    <Input
                      id="facebook_url"
                      value={config.facebook_url}
                      onChange={(e) => setConfig({ ...config, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div>
                    <Label htmlFor="twitter_url">Twitter URL</Label>
                    <Input
                      id="twitter_url"
                      value={config.twitter_url}
                      onChange={(e) => setConfig({ ...config, twitter_url: e.target.value })}
                      placeholder="https://twitter.com/yourprofile"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input
                      id="instagram_url"
                      value={config.instagram_url}
                      onChange={(e) => setConfig({ ...config, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>

                  <div>
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      value={config.linkedin_url}
                      onChange={(e) => setConfig({ ...config, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>

                  <div>
                    <Label htmlFor="youtube_url">YouTube URL</Label>
                    <Input
                      id="youtube_url"
                      value={config.youtube_url}
                      onChange={(e) => setConfig({ ...config, youtube_url: e.target.value })}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {saving ? 'Saving...' : '💾 Save All Changes'}
              </Button>
            </div>

            {/* Info Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">ℹ️ How This Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>All contact information configured here will be automatically used across the entire website</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>Changes take effect immediately after saving</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>This includes: Footer, Contact pages, Support pages, Receipts, PDFs, and Email templates</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">•</span>
                    <span>All fields are publicly accessible via API for frontend display</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
