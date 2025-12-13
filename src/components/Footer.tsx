'use client';

import Link from 'next/link';
import Logo from '@/components/ui/logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { footerTranslations } from '@/translations/footer';

export default function Footer() {
  const { language } = useLanguage();
  const t = footerTranslations[language];
  return (
    <footer className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white py-12 sm:py-16 mt-12 sm:mt-16 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-24 sm:w-32 h-24 sm:h-32 bg-white rounded-full animate-float"></div>
        <div className="absolute bottom-10 right-10 w-16 sm:w-24 h-16 sm:h-24 bg-white rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-12 sm:w-16 h-12 sm:h-16 bg-white rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Logo Section */}
          <div className="mb-8 animate-fade-in">
            <Logo size="lg" showText={true} animated={true} className="justify-center" />
          </div>

          {/* Main Description */}
          <p className="text-white mb-6 sm:mb-8 text-base sm:text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed animate-slide-in-left px-4">
            {t.empoweringCitizens}
          </p>

          {/* Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12 animate-slide-in-right">
            {/* Quick Links */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center justify-center">
                {t.quickLinks}
              </h4>
              <div className="space-y-2 sm:space-y-3 text-center sm:text-left">
                <Link href={language === 'en' ? '/about' : `/${language}/about`} className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  {t.aboutUs}
                </Link>
                <Link href={language === 'en' ? '/services' : `/${language}/services`} className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  {t.services}
                </Link>
                <Link href="/how-it-works" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  How It Works
                </Link>
                <Link href="/service-centers" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  Service Centers
                </Link>
              </div>
            </div>

            {/* Support */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center justify-center">
                {t.support}
              </h4>
              <div className="space-y-2 sm:space-y-3 text-center sm:text-left">
                <Link href={language === 'en' ? '/contact' : `/${language}/contact`} className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  {t.contactUs}
                </Link>
                <Link href="/faq" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  {t.faq}
                </Link>
                <Link href="/testimonials" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  Testimonials
                </Link>
                <Link href="/trust" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  Why Trust Us
                </Link>
              </div>
            </div>

            {/* Legal & More */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 sm:col-span-2 md:col-span-1">
              <h4 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white flex items-center justify-center">
                {t.legal}
              </h4>
              <div className="space-y-2 sm:space-y-3 text-center sm:text-left">
                <Link href={language === 'en' ? '/privacy' : `/${language}/privacy`} className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  {t.privacyPolicy}
                </Link>
                <Link href={language === 'en' ? '/terms' : `/${language}/terms`} className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  {t.termsOfService}
                </Link>
                <Link href={language === 'en' ? '/refund-policy' : `/${language}/refund-policy`} className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  {t.refundPolicy}
                </Link>
                <Link href="/register" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  {t.becomeRetailer}
                </Link>
                <Link href="/careers" className="block text-white hover:text-yellow-300 transition-colors duration-300 font-medium hover:scale-105 transform text-sm sm:text-base">
                  Careers
                </Link>
              </div>
            </div>
          </div>

          {/* Company Registration Information */}
          <div className="border-t border-white/20 pt-8 sm:pt-10 mb-6 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-300">
              <h4 className="text-xl sm:text-2xl font-bold mb-6 text-center text-yellow-300 flex items-center justify-center gap-2">
                <span className="text-2xl">🏢</span>
                Company Registration Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* CIN */}
                  <div className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all duration-300">
                    <p className="text-yellow-300 font-semibold text-sm mb-1 flex items-center gap-2">
                      <span>📋</span> Corporate Identity Number (CIN)
                    </p>
                    <p className="text-white font-mono text-base sm:text-lg tracking-wide">
                      U74909PN2025PTC249261
                    </p>
                  </div>

                  {/* PAN */}
                  <div className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all duration-300">
                    <p className="text-yellow-300 font-semibold text-sm mb-1 flex items-center gap-2">
                      <span>💳</span> Permanent Account Number (PAN)
                    </p>
                    <p className="text-white font-mono text-base sm:text-lg tracking-wide">
                      AALCV6624P
                    </p>
                  </div>

                  {/* TAN */}
                  <div className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all duration-300">
                    <p className="text-yellow-300 font-semibold text-sm mb-1 flex items-center gap-2">
                      <span>🔢</span> Tax Deduction Account Number (TAN)
                    </p>
                    <p className="text-white font-mono text-base sm:text-lg tracking-wide">
                      PNEV28381D
                    </p>
                  </div>
                </div>

                {/* Right Column - Registered Address */}
                <div className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-all duration-300">
                  <p className="text-yellow-300 font-semibold text-sm mb-3 flex items-center gap-2">
                    <span>📍</span> Registered Office Address
                  </p>
                  <div className="text-white space-y-1 text-sm sm:text-base leading-relaxed">
                    <p className="font-bold text-base sm:text-lg">VIGHNAHARTA ONLINE SERVICES PRIVATE LIMITED</p>
                    <p>G NO 199/5, KUPWAD, MIRAJ</p>
                    <p>KUPWAD (M CO), Sangli</p>
                    <p>Miraj, Sangli - 416416</p>
                    <p className="font-semibold text-yellow-200">Maharashtra, India</p>
                  </div>
                </div>
              </div>

              {/* Incorporation Date */}
              <div className="text-center bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg p-4 border border-yellow-400/30">
                <p className="text-white text-sm sm:text-base">
                  <span className="text-yellow-300 font-semibold">📅 Incorporated on:</span>{' '}
                  <span className="font-bold">12th December 2025</span>
                  {' '}<span className="text-yellow-200">under the Companies Act, 2013</span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/20 pt-6 sm:pt-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 gap-4">
              <p className="text-white font-medium text-sm sm:text-base md:text-lg text-center md:text-left">
                {t.copyright}
              </p>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 animate-pulse">
                  <span className="text-pink-400 text-xs sm:text-base md:text-lg animate-bounce">💖</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 font-semibold text-xs sm:text-sm">
                    {t.developedWith}
                  </span>
                  <a
                    href="https://akrixsolutions.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 font-bold text-xs sm:text-sm hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg whitespace-nowrap"
                  >
                    Akrix Solutions
                  </a>
                  <span className="text-pink-400 text-xs sm:text-base md:text-lg animate-bounce">💖</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
