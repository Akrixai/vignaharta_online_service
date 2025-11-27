/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Netlify compatibility
  trailingSlash: false,
  
  // Image optimization settings
  images: {
    // Use remotePatterns for more control
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'nblvyqgtlsltuzbnhofz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      // CDN for static images
      // removed CDN hostname to avoid external CDN dependencies and CSP issues
    ],

    // Image formats to support
    formats: ['image/webp', 'image/avif'],

    // Image sizing for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Disable image optimization for static images in public folder
    // (set to false if you want next/image optimization in future)
    unoptimized: false,
  },

  // Asset optimization for CDN usage
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.vighnahartaonlineservice.in' : '',



  // Webpack configuration for better asset handling
  webpack: (config, { isServer }) => {
    // Optimize asset loading
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/,
      use: {
        loader: 'file-loader',
        options: {
          // Use local _next static path instead of external CDN
          publicPath: '/_next/static/images/',
          outputPath: 'static/images/',
          name: '[name].[hash].[ext]',
        },
      },
    });

    // Handle CSS files in production
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimize = true;
    }



    return config;
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Server external packages
  serverExternalPackages: ['critters'],

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },

  // Additional production optimizations
  generateEtags: false,

  // Security and caching headers
  async headers() {
    return [
      {
        source: '/vignaharta.(jpg|jpeg|png|svg|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            // Simplified CSP: allow only own origin and trusted font sources. Added Cashfree, reCAPTCHA Enterprise, and Tawk.to domains.
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://sdk.cashfree.com https://api.cashfree.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://recaptchaenterprise.googleapis.com https://embed.tawk.to https://*.tawk.to; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://sdk.cashfree.com https://embed.tawk.to https://*.tawk.to; font-src 'self' https://fonts.gstatic.com https://*.tawk.to; img-src 'self' data: https: blob: https://sdk.cashfree.com; connect-src 'self' https://nblvyqgtlsltuzbnhofz.supabase.co https://api.supabase.co wss://nblvyqgtlsltuzbnhofz.supabase.co https://sandbox.cashfree.com https://api.cashfree.com https://payments.cashfree.com https://sdk.cashfree.com https://www.google.com https://www.gstatic.com https://recaptchaenterprise.googleapis.com https://embed.tawk.to https://*.tawk.to https://va.tawk.to wss://*.tawk.to; frame-src 'self' https://vercel.live https://sandbox.cashfree.com https://payments.cashfree.com https://sdk.cashfree.com https://api.cashfree.com https://www.google.com https://www.recaptcha.net https://embed.tawk.to https://*.tawk.to; media-src 'self' https://*.tawk.to blob:;",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://sdk.cashfree.com" "https://api.cashfree.com" "https://sandbox.cashfree.com" "https://payments.cashfree.com")',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;