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
const defaultDescription = 'Upgrade from CSC to Vighnaharta Online Services - India\'s fastest digital portal for BBPS Bill Payments, NSDL PAN, and 100+ Govt Services. Get instant IDs, start earning immediately with the highest commissions. No more waiting like CSC - 100% Digital, Swift & Profitable.';

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
    'official government service portal',
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
    title: `${siteName} - Government Services Online Portal India`,
    description: defaultDescription,
    images: [
      {
        url: '/images/og-image.jpg?v=2',
        width: 1200,
        height: 630,
        alt: 'Vighnaharta Online Services - Government Portal',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Government Services Online Portal India`,
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
  category: 'Government Services',
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
    title: 'Vighnaharta Online Services | Best CSC Alternative | Fast IDs & High Commissions',
    description: 'Stop waiting for CSC IDs. Get instant access to NSDL PAN, BBPS, and 100+ Govt services. Vighnaharta Online Services is the fastest-growing digital portal for retailers. Start your digital shop today and earn more with India\'s premier service provider.',
    keywords: [
      'best csc alternative',
      'instant retailer id activation',
      'fastest pan card center registration',
      'high commission recharge portal',
      'csc login alternative',
      'government services business india',
      'instant digital shop creation',
      'vighnaharta vs csc',
      'highest margins for retailers',
      'one stop digital service hub',
      'government services online india',
      'digital india services',
      'online certificate application',
      'government portal',
      'vighnaharta online services',
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
      'vighnaharta services',
      'government service provider india',
      'digital service provider india',
      'online government service provider',
      'nsdl authorized pan center',
      'bharat connect bbps portal',
      'bill payment through vighnaharta',
      'official nsdl pan card portal'
    ],
    canonical: '/',
  },
  login: {
    title: 'Login - Vighnaharta Online Services | Secure Government Portal Access | Citizen, Retailer, Employee Login',
    description: 'Secure login to Vighnaharta Online Services. Access your government service applications, track status, and manage your digital certificates safely. Citizen, retailer, and employee login portals available.',
    keywords: [
      'government portal login',
      'secure login',
      'vighnaharta login',
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
    title: 'Register - Vighnaharta Online Services | Become a Government Service Retailer | Join Digital India',
    description: 'Register with Vighnaharta Online Services to become a government service retailer. Join India\'s premier digital government services network. Quick registration process for digital government services in India with earning opportunities.',
    keywords: [
      'government portal registration',
      'register government services',
      'vighnaharta registration',
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
    title: 'About Us - Vighnaharta Online Services | Leading Government Service Provider | Digital India Initiative',
    description: 'Learn about Vighnaharta Online Services, India\'s trusted government service portal. We provide digital access to government certificates, licenses, and schemes through our nationwide retailer network. Part of Digital India initiative.',
    keywords: [
      'about vighnaharta',
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
    title: 'Contact Us - Vighnaharta Online Services | Government Services Support | Help & Assistance',
    description: 'Contact Vighnaharta Online Services for support with government applications, certificates, and digital services. Get help with your government service needs through phone, email, or WhatsApp. 24/7 customer support available.',
    keywords: [
      'government services contact',
      'vighnaharta contact',
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
    title: 'Government Services - Vighnaharta Online Services | Apply for Aadhaar, PAN, Passport, Certificates Online',
    description: 'Explore all 100+ government services available through Vighnaharta Online Services. Apply for Aadhaar card, PAN card, Passport, Birth Certificate, Death Certificate, Income Certificate, Caste Certificate and access government schemes online with fast processing.',
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
    logo: `${baseUrl}/vignaharta.png?v=2`,
    description: "Vighnaharta Online Services is India's leading digital government services portal, providing official NSDL PAN card services and Bharat Connect (BBPS) bill payments. We offer 100+ government services online with fast processing and secure delivery.",
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
  // Additional GovernmentService schemas for popular services
  casteCertificateService: {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'Caste Certificate Services',
    serviceType: 'Certificates',
    description: 'Apply for caste certificates from government authorities',
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
  voterIdService: {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'Voter ID Services',
    serviceType: 'Identity Services',
    description: 'Apply for new Voter ID card or update existing details online',
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
      name: 'Election Commission of India'
    },
    category: 'Identity Documents',
    serviceAudience: {
      '@type': 'Audience',
      audienceType: 'Indian Citizens'
    }
  },
  bankAccountService: {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: 'Bank Account Opening Services',
    serviceType: 'Financial Services',
    description: 'Open bank accounts with government assistance and support',
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
          text: 'Visit your nearest Vighnaharta Online Service retailer, submit required documents, and track your application status in real-time through our digital platform.'
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
          text: 'Yes! Our portal is directly integrated with NSDL. You can apply for a New PAN Card (Paperless e-KYC), request PAN Corrections, or resume incomplete applications at the lowest market cost.'
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
          text: 'Yes, direct customers get attractive cashback rewards instantly in their wallet for every recharge and bill payment made through our secure portal.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is Vighnaharta Online Services?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Vighnaharta Online Services is India\'s premier digital government services portal that provides access to 100+ government services online. We help citizens apply for Aadhaar Card, PAN Card, Passport, Birth Certificate, Death Certificate, Income Certificate, Caste Certificate, and other government schemes digitally with fast, secure, and reliable processing.'
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
          text: 'The key benefits of using Vighnaharta Online Services include: 1) Digital India Initiative participation, 2) Nationwide access to government services, 3) Fast processing with real-time tracking, 4) Secure and reliable service with bank-level encryption, 5) User-friendly interface, and 6) Extensive retailer network support across India.'
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
