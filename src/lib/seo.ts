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
const siteName = 'Vighnaharta Online Services';
const defaultDescription = 'Vighnaharta Online Services - India\'s all-in-one digital services platform for BBPS bill payments, NSDL PAN card services, mobile recharge & more. Earn guaranteed rewards and commissions on every transaction. Start your digital business today.';

export const defaultSEO: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${siteName} - Digital Services & Bill Payments Platform India`,
    template: `%s | ${siteName}`
  },
  description: defaultDescription,
  keywords: [
    'digital services platform india',
    'bbps bill payment india',
    'nsdl pan card online',
    'recharge commission for retailers',
    'electricity bill cashback',
    'nsdl pan center registration',
    'online pan correction',
    'vighnaharta online services',
    'high commission recharge app',
    'all in one bill payment portal',
    'nsdl paperless pan card',
    'bharat connect services',
    'digital service provider',
    'retailer business opportunity'
  ],
  authors: [{ name: 'Vighnaharta Online Services' }],
  creator: 'Vighnaharta Online Services',
  publisher: 'Vighnaharta Online Services',
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
    title: `${siteName} - Digital Services & Bill Payments Platform India`,
    description: defaultDescription,
    images: [
      {
        url: '/images/og-image.jpg?v=2',
        width: 1200,
        height: 630,
        alt: 'Vighnaharta Online Services - Digital Services Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Digital Services & Bill Payments Platform India`,
    description: defaultDescription,
    images: ['/images/twitter-image.jpg?v=2'],
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
  category: 'Digital Services',
};

export function generateSEO(config: SEOConfig): Metadata {
  const title = config.title;
  const description = config.description;
  const canonical = config.canonical ? `${baseUrl}${config.canonical}` : baseUrl;
  const ogImage = config.ogImage || '/images/og-image.jpg?v=2';

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
    title: 'Vighnaharta Online Services | Digital Services, Bill Payments & Recharge Platform',
    description: 'Vighnaharta Online Services - India\'s all-in-one digital services platform. NSDL PAN card services, BBPS bill payments, mobile recharge & 100+ digital services. Earn instant commissions and cashback rewards on every transaction.',
    keywords: [
      'digital services platform india',
      'instant retailer id activation',
      'fastest pan card center registration',
      'high commission recharge portal',
      'online bill payment india',
      'digital services business india',
      'instant digital shop creation',
      'highest margins for retailers',
      'one stop digital service hub',
      'online services india',
      'digital india services',
      'online certificate application',
      'digital services portal',
      'vighnaharta online services',
      'online license application',
      'digital certificates',
      'online forms',
      'service center',
      'digital india portal',
      'pan card apply online',
      'passport application online',
      'birth certificate online',
      'income certificate online',
      'nsdl authorized pan center',
      'bharat connect bbps portal',
      'bill payment through vighnaharta',
      'nsdl pan card portal'
    ],
    canonical: '/',
  },
  login: {
    title: 'Login - Vighnaharta Online Services | Secure Digital Services Access',
    description: 'Secure login to Vighnaharta Online Services. Access your service applications, track status, and manage your digital documents. Login portals for customers, retailers, and employees.',
    keywords: [
      'digital services login',
      'secure login',
      'vighnaharta login',
      'digital services access',
      'customer login',
      'retailer login',
      'employee login',
      'service portal login',
      'secure digital access'
    ],
    canonical: '/login',
  },
  register: {
    title: 'Register - Vighnaharta Online Services | Become a Digital Services Retailer',
    description: 'Register with Vighnaharta Online Services to become a digital services retailer. Join India\'s growing digital services network. Start earning commissions on bill payments, recharge & PAN services today.',
    keywords: [
      'digital portal registration',
      'register digital services',
      'vighnaharta registration',
      'digital services signup',
      'become digital service retailer',
      'service provider registration',
      'digital services business',
      'retailer registration',
      'earn commission online'
    ],
    canonical: '/register',
  },
  about: {
    title: 'About Us - Vighnaharta Online Services | Leading Digital Service Provider India',
    description: 'Learn about Vighnaharta Online Services, India\'s trusted digital services platform. We provide NSDL PAN card services, BBPS bill payments, mobile recharge & more through our nationwide retailer network.',
    keywords: [
      'about vighnaharta',
      'digital service provider',
      'online services india',
      'digital services company',
      'service network india',
      'trusted digital services',
      'india services portal',
      'digital transformation'
    ],
    canonical: '/about',
  },
  contact: {
    title: 'Contact Us - Vighnaharta Online Services | Customer Support & Help',
    description: 'Contact Vighnaharta Online Services for support with your applications, bill payments, and digital services. Get help through phone, email, or WhatsApp. Customer support available.',
    keywords: [
      'digital services contact',
      'vighnaharta contact',
      'customer support',
      'digital services help',
      'services assistance',
      'contact support',
      'whatsapp support',
      'customer care'
    ],
    canonical: '/contact',
  },
  services: {
    title: 'Services - Vighnaharta Online Services | PAN Card, Bill Payments, Recharge & More',
    description: 'Explore all 100+ digital services available through Vighnaharta Online Services. NSDL PAN card application, BBPS bill payments, mobile recharge, certificate assistance, and more with fast processing and guaranteed rewards.',
    keywords: [
      'digital services list',
      'online certificates',
      'digital licenses',
      'online schemes',
      'pan card services',
      'bill payment services',
      'recharge services',
      'pan card application',
      'passport application online',
      'birth certificate application',
      'income certificate application',
      'document services online',
      'digital certificates',
      'fast digital services'
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
    logo: `${baseUrl}/vignaharta.png?v=2`,
    description: "Vighnaharta Online Services is India's leading digital services platform, providing NSDL PAN card services, Bharat Connect (BBPS) bill payments, mobile recharge & 100+ digital services with fast processing and guaranteed rewards.",
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-7499116527',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi', 'Marathi'],
    },
    sameAs: [
      'https://www.facebook.com/share/171jarrh5y/',
      'https://x.com/services6527?t=mPY7WesWRbXSCF5rXSiRCg&s=08',
      'https://www.linkedin.com/in/prem-sargar-802214390/?utm_source=share_via&utm_content=profile&utm_medium=member_android',
      'https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_content=zrqm86t'
    ],
  },
  // Local Business structured data for better local SEO
  localBusiness: {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/#organization`,
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png?v=2`,
    description: defaultDescription,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'India',
      addressCountry: 'IN'
    },
    telephone: '+91-7499116527',
    sameAs: [
      'https://www.facebook.com/share/171jarrh5y/',
      'https://x.com/services6527?t=mPY7WesWRbXSCF5rXSiRCg&s=08',
      'https://www.linkedin.com/in/prem-sargar-802214390/?utm_source=share_via&utm_content=profile&utm_medium=member_android',
      'https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_content=zrqm86t'
    ],
    areaServed: {
      '@type': 'Country',
      name: 'India'
    },
    availableLanguage: [
      {
        '@type': 'Language',
        name: 'English'
      },
      {
        '@type': 'Language',
        name: 'Marathi'
      },
      {
        '@type': 'Language',
        name: 'Hindi'
      }
    ]
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
  professionalService: {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Digital Services Platform',
    description: 'Online digital services including PAN card applications, bill payments, mobile recharge, certificate assistance and more',
    serviceType: [
      'PAN Card Services',
      'Bill Payment Services',
      'Mobile Recharge',
      'Certificate Assistance',
      'Document Services'
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
      audienceType: 'Customers in India'
    },
    offers: {
      '@type': 'Offer',
      category: 'Digital Services'
    }
  },
  // Service schemas for specific services
  panService: {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'PAN Card Services',
    serviceType: 'Identity Document Services',
    description: 'Apply for new PAN card or request corrections through authorized NSDL integration',
    provider: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    category: 'Identity Documents',
    serviceAudience: {
      '@type': 'Audience',
      audienceType: 'Customers in India'
    }
  },
  billPaymentService: {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'BBPS Bill Payment Services',
    serviceType: 'Bill Payment Services',
    description: 'Pay electricity, gas, water, broadband, DTH and more bills through Bharat Bill Payment System (BBPS)',
    provider: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    category: 'Financial Services',
    serviceAudience: {
      '@type': 'Audience',
      audienceType: 'Customers in India'
    }
  },
  rechargeService: {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Mobile Recharge Services',
    serviceType: 'Telecom Services',
    description: 'Instant mobile recharge for all operators with cashback rewards',
    provider: {
      '@type': 'Organization',
      name: siteName,
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    category: 'Telecom Services',
    serviceAudience: {
      '@type': 'Audience',
      audienceType: 'Customers in India'
    }
  },
  // FAQ structured data for rich snippets
  faqPage: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What digital services are available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer 100+ digital services including PAN Card application & correction through NSDL, BBPS bill payments (electricity, gas, water, broadband), mobile recharge, DTH recharge, FASTag recharge, certificate assistance, and more.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I apply for services?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Visit your nearest Vighnaharta Online Service retailer, submit required documents, and track your application status in real-time through our digital platform.'
        }
      },
      {
        '@type': 'Question',
        name: 'How long does it take to process applications?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Processing time varies by service. PAN card applications typically take 3-7 working days. You can check estimated processing times on each service page.'
        }
      },
      {
        '@type': 'Question',
        name: 'What are the BBPS categories available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We support all Bharat Bill Pay System (BBPS) categories including Mobile Recharge, DTH, Electricity, Piped Gas, Water, Broadband, Landline, FASTag, Insurance, and more. Retailers earn top commissions on every payment.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I apply for a new PAN card or correction here?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Our platform is integrated with NSDL. You can apply for a New PAN Card (Paperless e-KYC), request PAN Corrections, or resume incomplete applications at competitive rates.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much commission do retailers earn on BBPS?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Retailers earn the highest industry margins on every BBPS transaction. Joining our network allows you to earn substantial profits on every mobile recharge, electricity bill, and water bill payment.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is there any cashback for customers on bill payments?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, customers get attractive cashback rewards instantly in their wallet for every recharge and bill payment made through our secure platform.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is Vighnaharta Online Services?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vighnaharta Online Services is India\'s premier digital services platform that provides access to 100+ services online including NSDL PAN card application, BBPS bill payments, mobile recharge, certificate assistance, and more with fast, secure processing and guaranteed rewards.'
        }
      },
      {
        '@type': 'Question',
        name: 'How can I find Vighnaharta Online Services near me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vighnaharta Online Services has a nationwide network of over 10,000+ service centers across India. You can locate the nearest service center through our website or mobile app, or call our customer support at +91-7499116527 for assistance.'
        }
      },
      {
        '@type': 'Question',
        name: 'What are the benefits of using Vighnaharta Online Services?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Key benefits include: 1) Nationwide access to digital services, 2) Fast processing with real-time tracking, 3) Secure and reliable with bank-level encryption, 4) Guaranteed cashback rewards, 5) User-friendly interface, and 6) Extensive retailer network support.'
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
        name: 'Services',
        item: `${baseUrl}/services`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'PAN Card',
        item: `${baseUrl}/services/pan-card`
      }
    ]
  }
};
