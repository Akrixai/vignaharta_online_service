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
    title: 'Vignaharta Online Services - Government Services Portal India | Digital India | Apply for Aadhaar, PAN, Passport Online',
    description: 'Access all government services online with Vignaharta Online Services. Apply for Aadhaar card, PAN card, Passport, Birth Certificate, Income Certificate and 100+ government services digitally. Fast, secure, and reliable government service portal in India with nationwide retailer network.',
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
      'government document services',
      'apply for aadhaar online',
      'apply for pan card online',
      'online passport application',
      'birth certificate online',
      'income certificate online',
      'government services near me',
      'digital india government services'
    ],
    canonical: '/',
  },
  login: {
    title: 'Login - Vignaharta Online Services | Secure Government Portal Access | Citizen, Retailer, Employee Login',
    description: 'Secure login to Vignaharta Online Services. Access your government service applications, track status, and manage your digital certificates safely. Citizen, retailer, and employee login portals available.',
    keywords: [
      'government portal login',
      'secure login',
      'vignaharta login',
      'government services access',
      'digital india login',
      'citizen login',
      'retailer login',
      'employee login',
      'government service portal login',
      'secure government portal access'
    ],
    canonical: '/login',
  },
  register: {
    title: 'Register - Vignaharta Online Services | Become a Government Service Retailer | Join Digital India',
    description: 'Register with Vignaharta Online Services to become a government service retailer. Join India\'s premier digital government services network. Quick registration process for digital government services in India with earning opportunities.',
    keywords: [
      'government portal registration',
      'register government services',
      'vignaharta registration',
      'digital india registration',
      'government services signup',
      'become government service retailer',
      'government service provider registration',
      'join digital india',
      'government service business',
      'retailer registration'
    ],
    canonical: '/register',
  },
  about: {
    title: 'About Us - Vignaharta Online Services | Leading Government Service Provider | Digital India Initiative',
    description: 'Learn about Vignaharta Online Services, India\'s trusted government service portal. We provide digital access to government certificates, licenses, and schemes through our nationwide retailer network. Part of Digital India initiative.',
    keywords: [
      'about vignaharta',
      'government service provider',
      'digital india services',
      'online government portal',
      'government services company',
      'digital india initiative',
      'government service network',
      'trusted government services',
      'india government services portal',
      'digital transformation government'
    ],
    canonical: '/about',
  },
  contact: {
    title: 'Contact Us - Vignaharta Online Services | Government Services Support | Help & Assistance',
    description: 'Contact Vignaharta Online Services for support with government applications, certificates, and digital services. Get help with your government service needs through phone, email, or WhatsApp. 24/7 customer support available.',
    keywords: [
      'government services contact',
      'vignaharta contact',
      'government portal support',
      'digital services help',
      'government services assistance',
      'government service help',
      'contact government services',
      'government portal customer support',
      'whatsapp government services',
      '24/7 government services support'
    ],
    canonical: '/contact',
  },
  services: {
    title: 'Government Services - Vignaharta Online Services | Apply for Aadhaar, PAN, Passport, Certificates Online',
    description: 'Explore all 100+ government services available through Vignaharta Online Services. Apply for Aadhaar card, PAN card, Passport, Birth Certificate, Death Certificate, Income Certificate, Caste Certificate and access government schemes online with fast processing.',
    keywords: [
      'government services list',
      'online certificates',
      'digital licenses',
      'government schemes',
      'e-governance services',
      'government applications online',
      'apply for aadhaar',
      'apply for pan card',
      'online passport application',
      'birth certificate application',
      'death certificate application',
      'income certificate application',
      'caste certificate application',
      'government document services online',
      'digital government certificates',
      'fast government services'
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
      availableLanguage: ['English', 'Hindi', 'Marathi'],
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
    serviceType: [
      'Identity Services',
      'Certificates',
      'Travel Documents',
      'Financial Services',
      'Utility Services'
    ],
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
    audience: {
      '@type': 'Audience',
      audienceType: 'Citizens of India'
    },
    offers: {
      '@type': 'Offer',
      category: 'Government Services'
    }
  },
  // Additional GovernmentService schemas for specific services
  aadhaarService: {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'Aadhaar Card Services',
    serviceType: 'Identity Services',
    description: 'Apply for new Aadhaar card or update existing details online',
    provider: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    serviceOperator: {
      '@type': 'Organization',
      name: 'Unique Identification Authority of India'
    },
    category: 'Identity Documents',
    serviceAudience: {
      '@type': 'Audience',
      audienceType: 'Indian Citizens'
    }
  },
  panService: {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'PAN Card Services',
    serviceType: 'Identity Services',
    description: 'Apply for new PAN card or update existing details online',
    provider: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    serviceOperator: {
      '@type': 'Organization',
      name: 'Income Tax Department'
    },
    category: 'Identity Documents',
    serviceAudience: {
      '@type': 'Audience',
      audienceType: 'Indian Citizens'
    }
  },
  passportService: {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'Passport Services',
    serviceType: 'Travel Documents',
    description: 'Apply for fresh passport or renewal applications online',
    provider: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    serviceOperator: {
      '@type': 'Organization',
      name: 'Passport Seva Kendra'
    },
    category: 'Travel Documents',
    serviceAudience: {
      '@type': 'Audience',
      audienceType: 'Indian Citizens'
    }
  },
  birthCertificateService: {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'Birth Certificate Services',
    serviceType: 'Certificates',
    description: 'Apply for birth certificates online',
    provider: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    category: 'Certificates',
    serviceAudience: {
      '@type': 'Audience',
      audienceType: 'Indian Citizens'
    }
  },
  incomeCertificateService: {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'Income Certificate Services',
    serviceType: 'Certificates',
    description: 'Apply for income certificates from government authorities',
    provider: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    category: 'Certificates',
    serviceAudience: {
      '@type': 'Audience',
      audienceType: 'Indian Citizens'
    }
  },
  // FAQ structured data for rich snippets
  faqPage: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What government services are available online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer 100+ government services including Aadhaar Card, PAN Card, Passport, Birth Certificate, Death Certificate, Income Certificate, Caste Certificate, Voter ID, Bank Account Opening, Insurance Services, and Electricity Connection.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I apply for government services?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Visit your nearest Vignaharta Online Service retailer, submit required documents, and track your application status in real-time through our digital platform.'
        }
      },
      {
        '@type': 'Question',
        name: 'How long does it take to process government applications?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Processing time varies by service. Most certificates take 5-15 working days. You can check estimated processing times on each service page.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is my personal information secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, we use bank-level security with SSL encryption to protect your personal information. All data is stored securely and complies with Indian data protection regulations.'
        }
      }
    ]
  },
  // Breadcrumb structured data
  breadcrumb: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Government Services',
        item: `${baseUrl}/services`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Aadhaar Card',
        item: `${baseUrl}/services/aadhaar-card`
      }
    ]
  }
};
