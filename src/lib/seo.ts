import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const baseUrl = 'https://www.vighnahartaonlineservice.in';
const siteName = 'Vignaharta Online Services';
const defaultDescription = 'Vignaharta Online Services - Your trusted partner for all government services online. Apply for certificates, licenses, and government schemes digitally. Fast, secure, and reliable government service portal in India.';

export const defaultSEO: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${siteName} - Government Services Online Portal India`,
    template: `%s | ${siteName}`
  },
  description: defaultDescription,
  keywords: [
    'government services online',
    'digital india services',
    'online certificate application',
    'government portal india',
    'vignaharta online services',
    'digital government services',
    'online license application',
    'government schemes online',
    'e-governance services',
    'digital certificates india',
    'online government forms',
    'government service portal',
    'digital india initiative',
    'online government applications',
    'government document services',
    'digital service provider',
    'online government schemes',
    'government services platform',
    'digital government portal',
    'online service center'
  ],
  authors: [{ name: 'Vignaharta Online Services' }],
  creator: 'Vignaharta Online Services',
  publisher: 'Vignaharta Online Services',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: baseUrl,
    siteName,
    title: `${siteName} - Government Services Online Portal India`,
    description: defaultDescription,
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Vignaharta Online Services - Government Portal',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Government Services Online Portal India`,
    description: defaultDescription,
    images: ['/images/twitter-image.jpg'],
    creator: '@VighnahartaOnline',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: baseUrl,
  },
  category: 'Government Services',
};

export function generateSEO(config: SEOConfig): Metadata {
  const title = config.title;
  const description = config.description;
  const canonical = config.canonical ? `${baseUrl}${config.canonical}` : baseUrl;
  const ogImage = config.ogImage || '/images/og-image.jpg';

  return {
    title,
    description,
    keywords: config.keywords,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical,
    },
    robots: {
      index: !config.noIndex,
      follow: !config.noIndex,
    },
  };
}

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: 'Vignaharta Online Services - Government Services Portal India | Digital India',
    description: 'Access all government services online with Vignaharta Online Services. Apply for certificates, licenses, and government schemes digitally. Fast, secure, and reliable government service portal in India.',
    keywords: [
      'government services online india',
      'digital india services',
      'online certificate application',
      'government portal',
      'vignaharta online services',
      'digital government services',
      'online license application',
      'government schemes online',
      'e-governance services india',
      'digital certificates',
      'online government forms',
      'government service center',
      'digital india portal',
      'online government applications',
      'government document services'
    ],
    canonical: '/',
  },
  login: {
    title: 'Login - Vignaharta Online Services | Secure Government Portal Access',
    description: 'Secure login to Vignaharta Online Services. Access your government service applications, track status, and manage your digital certificates safely.',
    keywords: [
      'government portal login',
      'secure login',
      'vignaharta login',
      'government services access',
      'digital india login'
    ],
    canonical: '/login',
  },
  register: {
    title: 'Register - Vignaharta Online Services | Join Government Services Portal',
    description: 'Register with Vignaharta Online Services to access all government services online. Quick registration process for digital government services in India.',
    keywords: [
      'government portal registration',
      'register government services',
      'vignaharta registration',
      'digital india registration',
      'government services signup'
    ],
    canonical: '/register',
  },
  about: {
    title: 'About Us - Vignaharta Online Services | Leading Government Service Provider',
    description: 'Learn about Vignaharta Online Services, India\'s trusted government service portal. We provide digital access to government certificates, licenses, and schemes.',
    keywords: [
      'about vignaharta',
      'government service provider',
      'digital india services',
      'online government portal',
      'government services company'
    ],
    canonical: '/about',
  },
  contact: {
    title: 'Contact Us - Vignaharta Online Services | Government Services Support',
    description: 'Contact Vignaharta Online Services for support with government applications, certificates, and digital services. Get help with your government service needs.',
    keywords: [
      'government services contact',
      'vignaharta contact',
      'government portal support',
      'digital services help',
      'government services assistance'
    ],
    canonical: '/contact',
  },
  services: {
    title: 'Government Services - Vignaharta Online Services | Digital Certificates & Licenses',
    description: 'Explore all government services available through Vignaharta Online Services. Apply for certificates, licenses, and access government schemes online.',
    keywords: [
      'government services list',
      'online certificates',
      'digital licenses',
      'government schemes',
      'e-governance services',
      'government applications online'
    ],
    canonical: '/services',
  },
};

// Structured data for better SEO
export const structuredData = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    description: defaultDescription,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-7499116527',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },
    sameAs: [
      'https://www.facebook.com/vighnahartaonlineservices',
      'https://www.twitter.com/VighnahartaOnline',
      'https://www.linkedin.com/company/vignaharta-online-services',
    ],
  },
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: baseUrl,
    description: defaultDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
  governmentService: {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'Digital Government Services',
    description: 'Online government services including certificates, licenses, and scheme applications',
    provider: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: baseUrl,
      serviceSmsNumber: '+91-7499116527',
    },
  },
};
