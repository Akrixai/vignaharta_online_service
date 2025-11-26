import { useState, useEffect } from 'react';

export interface ContactConfig {
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

const defaultConfig: ContactConfig = {
  company_name: 'Vighnaharta Online Services',
  contact_email: 'info@vignahartajanseva.com',
  support_email: 'vighnahartaenterprises.sangli@gmail.com',
  technical_email: 'vighnahartaenterprises.sangli@gmail.com',
  contact_phone: '+91 9876543210',
  contact_phone_secondary: '+91-7499116527',
  contact_whatsapp: '+91 9876543210',
  whatsapp_support_number: '917499116527',
  office_address: 'Vignaharta Janseva, Main Street, City, State - 123456',
  office_address_full: 'Bajrang Nagar, MIDC Kupwad, Maharashtra 416436, India',
  office_hours: 'Monday to Saturday, 9:00 AM to 6:00 PM',
  support_hours: 'Mon-Sat: 9:00 AM - 6:00 PM',
  company_tagline: 'Your Trusted Partner for Government Services',
  facebook_url: 'https://facebook.com/vighnaharta',
  twitter_url: 'https://twitter.com/vighnaharta',
  instagram_url: 'https://instagram.com/vighnaharta',
  linkedin_url: 'https://linkedin.com/company/vighnaharta',
  youtube_url: 'https://youtube.com/@vighnaharta'
};

export function useContactConfig() {
  const [config, setConfig] = useState<ContactConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/config?category=CONTACT');
      const result = await response.json();
      
      if (result.success && result.data) {
        const configData: any = { ...defaultConfig };
        result.data.forEach((item: any) => {
          configData[item.config_key] = item.config_value;
        });
        setConfig(configData as ContactConfig);
      }
    } catch (err) {
      console.error('Error fetching contact config:', err);
      setError('Failed to load contact configuration');
      // Keep using default config on error
    } finally {
      setLoading(false);
    }
  };

  return { config, loading, error, refetch: fetchConfig };
}
