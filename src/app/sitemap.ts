import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.vighnahartaonlineservice.in'
  const currentDate = new Date();

  // Government service categories with enhanced priority for key services
  const serviceCategories = [
    { name: 'aadhaar-card', priority: 0.95 },
    { name: 'pan-card', priority: 0.95 },
    { name: 'passport', priority: 0.92 },
    { name: 'birth-certificate', priority: 0.9 },
    { name: 'death-certificate', priority: 0.85 },
    { name: 'income-certificate', priority: 0.9 },
    { name: 'caste-certificate', priority: 0.85 },
    { name: 'domicile-certificate', priority: 0.8 },
    { name: 'voter-id', priority: 0.88 },
    { name: 'bank-account', priority: 0.8 },
    { name: 'insurance', priority: 0.75 },
    { name: 'electricity-connection', priority: 0.8 }
  ];

  // Generate service page URLs with optimized change frequency
  const servicePages = serviceCategories.map(category => ({
    url: `${baseUrl}/services/${category.name}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: category.priority,
  }));

  // Marathi language pages with enhanced priority
  const marathiPages = [
    {
      url: `${baseUrl}/mr`,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 0.95,
    },
    {
      url: `${baseUrl}/mr/services`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mr/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mr/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }
  ];

  // Additional high-value government service pages
  const additionalServicePages = [
    {
      url: `${baseUrl}/services/aadhaar-card/new-enrollment`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/aadhaar-card/update-details`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/services/pan-card/new-application`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/pan-card/correction`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    }
  ];

  return [
    // Homepage - highest priority
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    // Main navigation pages
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.98,
    },
    // Service pages
    ...servicePages,
    // Additional service pages
    ...additionalServicePages,
    // Marathi pages
    ...marathiPages,
    // Contact and support
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    // User account pages
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // Legal pages - lower priority but still important
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.4,
    },
  ]
}
