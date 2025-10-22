import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/components/providers/session-provider";
import { Toaster } from "react-hot-toast";
import NotificationManager from "@/components/NotificationManager";
import ErrorBoundary from "@/components/ErrorBoundary";
import { defaultSEO, structuredData } from "@/lib/seo";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });
const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/vignaharta.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Hreflang tags for multilingual support */}
        <link rel="alternate" hrefLang="en" href="https://www.vighnahartaonlineservice.in" />
        <link rel="alternate" hrefLang="mr" href="https://www.vighnahartaonlineservice.in/mr" />
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
        {structuredData?.faqPage && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.faqPage),
            }}
          />
        )}
      </head>
      <body className={`${inter.className} ${notoSansDevanagari.variable} antialiased`}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
        <NextAuthSessionProvider>
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
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}