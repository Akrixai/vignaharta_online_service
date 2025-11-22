import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/components/providers/session-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "react-hot-toast";
import NotificationManager from "@/components/NotificationManager";
import ErrorBoundary from "@/components/ErrorBoundary";
import { defaultSEO, structuredData } from "@/lib/seo";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  display: 'swap',
  variable: '--font-devanagari'
});

// Ensure defaultSEO is properly defined
const metadataConfig: Metadata = {
  ...(defaultSEO || {}),
  metadataBase: new URL('https://www.vighnahartaonlineservice.in'),
};

export const metadata: Metadata = metadataConfig;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // For now, we'll keep English as default, but Marathi content is supported through Noto Sans Devanagari font
  return (
    <html lang="en" className={`${inter.variable} ${notoSansDevanagari.variable}`}>
      <head>
        <link rel="icon" href="https://cdn.vighnahartaonlineservice.in/favicon.ico" sizes="any" />
        <link rel="icon" href="https://cdn.vighnahartaonlineservice.in/vignaharta.png" type="image/png" />
        <link rel="apple-touch-icon" href="https://cdn.vighnahartaonlineservice.in/apple-touch-icon.png" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Preconnect to reCAPTCHA Enterprise */}
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="preconnect" href="https://www.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preconnect to Cashfree SDK */}
        <link rel="preconnect" href="https://sdk.cashfree.com" />
        <link rel="dns-prefetch" href="https://sdk.cashfree.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.gstatic.com" />
        
        {/* Hreflang tags for multilingual support */}
        <link rel="alternate" hrefLang="en" href="https://www.vighnahartaonlineservice.in" />
        <link rel="alternate" hrefLang="en-IN" href="https://www.vighnahartaonlineservice.in" />
        <link rel="alternate" hrefLang="mr" href="https://www.vighnahartaonlineservice.in/mr" />
        <link rel="alternate" hrefLang="mr-IN" href="https://www.vighnahartaonlineservice.in/mr" />
        <link rel="alternate" hrefLang="x-default" href="https://www.vighnahartaonlineservice.in" />

        {/* Structured Data */}
        {structuredData?.organization && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.organization),
            }}
          />
        )}
        {structuredData?.localBusiness && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.localBusiness),
            }}
          />
        )}
        {structuredData?.website && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.website),
            }}
          />
        )}
        {structuredData?.governmentService && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.governmentService),
            }}
          />
        )}
        {structuredData?.aadhaarService && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.aadhaarService),
            }}
          />
        )}
        {structuredData?.panService && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.panService),
            }}
          />
        )}
        {structuredData?.passportService && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.passportService),
            }}
          />
        )}
        {structuredData?.birthCertificateService && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.birthCertificateService),
            }}
          />
        )}
        {structuredData?.incomeCertificateService && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.incomeCertificateService),
            }}
          />
        )}
        {structuredData?.casteCertificateService && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.casteCertificateService),
            }}
          />
        )}
        {structuredData?.voterIdService && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.voterIdService),
            }}
          />
        )}
        {structuredData?.bankAccountService && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.bankAccountService),
            }}
          />
        )}
        {structuredData?.faqPage && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.faqPage),
            }}
          />
        )}
      </head>
      <body className="antialiased">
        <NextAuthSessionProvider>
          <LanguageProvider>
            <NotificationManager>
                <ErrorBoundary>
                  {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      style: {
                        background: '#10b981',
                      },
                    },
                    error: {
                      duration: 5000,
                      style: {
                        background: '#ef4444',
                      },
                    },
                  }}
                />
              </ErrorBoundary>
            </NotificationManager>
          </LanguageProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}