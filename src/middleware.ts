import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from './types';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  userLimit.count++;
  return false;
}

function getClientIP(req: any): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return req.ip || 'unknown';
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Allow all static/public assets (images, icons, etc.)
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/static') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/vignaharta.png') ||
      pathname.startsWith('/vignaharta.jpg') ||
      pathname.startsWith('/NewVignaharta.png') ||
      pathname.startsWith('/apple-touch-icon.png') ||
      pathname.startsWith('/vercel.svg') ||
      pathname.startsWith('/next.svg') ||
      pathname.startsWith('/file.svg') ||
      pathname.startsWith('/globe.svg') ||
      pathname.startsWith('/window.svg') ||
      pathname.startsWith('/akrixPayQR.jpg') ||
      /\.(png|jpg|jpeg|svg|ico|webp|gif|css|js|woff|woff2|ttf|eot)$/.test(pathname)
    ) {
      return NextResponse.next();
    }

    // Add security headers to all responses
    const response = NextResponse.next();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Rate limiting for API routes
    if (pathname.startsWith('/api/')) {
      const clientIP = getClientIP(req);

      if (isRateLimited(clientIP)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '900', // 15 minutes
              ...securityHeaders,
            },
          }
        );
      }
    }

    // Allow access to public routes
    const publicRoutes = [
      '/',
      '/login',
      '/admin/login',
      '/register',
      '/about',
      '/services',
      '/contact',
      '/privacy',
      '/terms',
      '/refund-policy',
      '/social-media',
      '/forgot-password',
      '/reset-password',
      '/faq',
      '/testimonials',
      '/trust',
      '/how-it-works',
      '/service-centers',
      '/whats-new'
    ];

    // Allow language-specific routes (Marathi and Hindi)
    const isLanguageRoute = pathname.startsWith('/mr/') || pathname.startsWith('/hi/') || pathname === '/mr' || pathname === '/hi';

    // Allow all registration routes
    const isRegisterRoute = pathname.startsWith('/register');

    // Allow payment callback routes
    const isPaymentRoute = pathname.startsWith('/payment/');

    // Allow webhook routes (Cashfree, etc.)
    const isWebhookRoute = pathname.includes('/webhook');

    if (publicRoutes.includes(pathname) || isLanguageRoute || isRegisterRoute || isPaymentRoute || isWebhookRoute) {
      return response;
    }

    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check if user account is active
    if (token.is_active === false) {
      return new NextResponse(
        JSON.stringify({
          error: 'Account is deactivated. Please contact administrator.',
          code: 'ACCOUNT_DEACTIVATED'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders,
          },
        }
      );
    }

    // Role-based access control for dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const userRole = token.role as UserRole;

      // Admin routes (but NOT /dashboard/employees - that's handled separately)
      if (pathname.startsWith('/dashboard/retailers') ||
        pathname.startsWith('/dashboard/queries') ||
        pathname.startsWith('/dashboard/refunds')) {
        if (userRole !== UserRole.ADMIN) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Employee Management - Admin and Employees with designation
      if (pathname.startsWith('/dashboard/employees') ||
        pathname.startsWith('/dashboard/organization-hierarchy')) {
        const userDesignation = token.designation as string;
        const canCreateEmployees = ['MANAGER', 'STATE_MANAGER', 'DISTRICT_MANAGER', 'SUPERVISOR', 'DISTRIBUTOR'];

        // Allow Admin always
        if (userRole === UserRole.ADMIN) {
          // Allow access
        }
        // Allow Employees with proper designation
        else if (userRole === UserRole.EMPLOYEE && userDesignation && canCreateEmployees.includes(userDesignation)) {
          // Allow access
        }
        // Block everyone else
        else {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Admin and Employee routes
      if (pathname.startsWith('/dashboard/approvals')) {
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.EMPLOYEE) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Retailer-only routes
      if (pathname.startsWith('/dashboard/certificates')) {
        if (userRole !== UserRole.RETAILER) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Services and Support - Retailer and Customer access
      if (pathname.startsWith('/dashboard/services') ||
        pathname.startsWith('/dashboard/support') ||
        pathname.startsWith('/dashboard/help-support')) {
        if (userRole !== UserRole.RETAILER && userRole !== UserRole.CUSTOMER) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Products - Retailer, Employee, and Customer access
      if (pathname.startsWith('/dashboard/products')) {
        if (userRole !== UserRole.RETAILER && userRole !== UserRole.EMPLOYEE && userRole !== UserRole.CUSTOMER) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Training - Retailer and Employee access only
      if (pathname.startsWith('/dashboard/training') ||
        pathname.startsWith('/dashboard/training-videos')) {
        if (userRole !== UserRole.RETAILER && userRole !== UserRole.EMPLOYEE) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Applications and Receipts - Retailer and Customer access
      if (pathname.startsWith('/dashboard/applications') ||
        pathname.startsWith('/dashboard/receipts')) {
        if (userRole !== UserRole.RETAILER && userRole !== UserRole.CUSTOMER) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Wallet access (Admin, Retailer, Customer only - not Employee)
      if (pathname.startsWith('/dashboard/wallet')) {
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.RETAILER && userRole !== UserRole.CUSTOMER) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow public routes
        const publicRoutes = [
          '/',
          '/login',
          '/admin/login',
          '/register',
          '/about',
          '/services',
          '/contact',
          '/privacy',
          '/terms',
          '/refund-policy',
          '/social-media',
          '/forgot-password',
          '/reset-password',
          '/faq',
          '/testimonials',
          '/trust',
          '/how-it-works',
          '/service-centers'
        ];

        // Allow language-specific routes (Marathi and Hindi)
        const isLanguageRoute = pathname.startsWith('/mr/') || pathname.startsWith('/hi/') || pathname === '/mr' || pathname === '/hi';

        // Allow all registration routes
        const isRegisterRoute = pathname.startsWith('/register');

        // Allow payment callback routes
        const isPaymentRoute = pathname.startsWith('/payment/');

        if (publicRoutes.includes(pathname) || isLanguageRoute || isRegisterRoute || isPaymentRoute) {
          return true;
        }

        // Require authentication for dashboard routes
        if (pathname.startsWith('/dashboard')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
