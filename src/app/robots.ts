import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.vighnahartaonlineservice.in'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin/',
          '/private/',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin/',
          '/private/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin/',
          '/private/',
        ],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin/',
          '/private/',
        ],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin/',
          '/private/',
        ],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin/',
          '/private/',
        ],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin/',
          '/private/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
