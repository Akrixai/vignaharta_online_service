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
        <div className="absolute bottom-10 right-10 w-16 sm:w-24 h-16 sm:h-24 bg-white rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-12 sm:w-16 h-12 sm:h-16 bg-white rounded-full animate-float" style={{animationDelay: '2s'}}></div>
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
