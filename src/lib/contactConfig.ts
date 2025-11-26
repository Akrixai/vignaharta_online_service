import { supabaseAdmin } from './supabase';

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

// Cache for contact config (1 minute TTL)
let cachedConfig: ContactConfig | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

export async function getContactConfig(): Promise<ContactConfig> {
  // Return cached config if still valid
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('site_configuration')
      .select('config_key, config_value')
      .eq('category', 'CONTACT')
      .eq('is_public', true);

    if (error) throw error;

    const config: any = { ...defaultConfig };
    data?.forEach((item) => {
      config[item.config_key] = item.config_value;
    });

    cachedConfig = config as ContactConfig;
    cacheTime = Date.now();

    return cachedConfig;
  } catch (error) {
    console.error('Error fetching contact config:', error);
    return defaultConfig;
  }
}

// Helper function to clear cache (useful after updates)
export function clearContactConfigCache() {
  cachedConfig = null;
  cacheTime = 0;
}
