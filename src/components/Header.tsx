'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Logo from '@/components/ui/logo';
import { UserRole } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { languages } from '@/lib/i18n';
import { headerTranslations } from '@/translations/header';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const t = headerTranslations[language];

  const handleLogin = () => {
    if (!session) {
      // Redirect to login page without role parameter
      // User will select role on login page
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <header className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 shadow-2xl sticky top-0 overflow-visible backdrop-blur-sm" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute floating-bg-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-float"></div>
        <div className="absolute floating-bg-5 bg-gradient-to-br from-orange-400 to-red-400 rounded-full animate-bounce"></div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 relative" style={{ zIndex: 10000 }}>
        <div className="flex items-center justify-between py-2 sm:py-2.5 md:py-3 gap-1 sm:gap-2">
          {/* Logo Section - Far Left */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 flex-shrink-0 min-w-0">
            <Link href={language === 'en' ? '/' : `/${language}`} className="flex-shrink-0">
              <Logo size="md" showText={true} animated={true} />
            </Link>
            <div className="hidden xl:block flex-shrink-0">
              <span className="text-white/90 text-xs xl:text-sm font-medium animate-fade-in whitespace-nowrap">
                {t.onlineServicePortal}
              </span>
              <div className="text-white/70 text-[10px] xl:text-xs whitespace-nowrap">
                {t.digitalIndiaInitiative}
              </div>
            </div>
          </div>

          {/* Center Section - Navigation & New Badge */}
          <div className="hidden lg:flex items-center space-x-1 lg:space-x-2 xl:space-x-3 flex-1 justify-center min-w-0">
            <nav className="flex items-center space-x-0.5 lg:space-x-1 xl:space-x-2">
              <Link href={language === 'en' ? '/about' : `/${language}/about`} className="text-white hover:text-red-200 px-1.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs xl:text-sm font-medium transform hover:scale-105 transition-all duration-200 hover:bg-red-700/50 relative group whitespace-nowrap">
                {t.about}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href={language === 'en' ? '/services' : `/${language}/services`} className="text-white hover:text-red-200 px-1.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs xl:text-sm font-medium transform hover:scale-105 transition-all duration-200 hover:bg-red-700/50 relative group whitespace-nowrap">
                {t.services}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/products" className="text-white hover:text-red-200 px-1.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs xl:text-sm font-medium transform hover:scale-105 transition-all duration-200 hover:bg-red-700/50 relative group whitespace-nowrap">
                Products
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href={language === 'en' ? '/contact' : `/${language}/contact`} className="text-white hover:text-red-200 px-1.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs xl:text-sm font-medium transform hover:scale-105 transition-all duration-200 hover:bg-red-700/50 relative group whitespace-nowrap">
                {t.contact}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>

            {/* New Features Notification Badge */}
            {showNotification && (
              <div className="hidden xl:flex items-center animate-fade-in">
                <div className="relative group flex items-center bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 rounded-full pl-2 pr-1 py-1">
                  <Link href="/whats-new" className="flex items-center gap-1 mr-1">
                    <span className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    <span className="text-xs font-bold text-yellow-100 group-hover:text-white whitespace-nowrap">
                      New! 🚀
                    </span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowNotification(false);
                    }}
                    className="text-yellow-200 hover:text-white transition-colors p-0.5 rounded-full hover:bg-white/10"
                    aria-label="Close notification"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-2 flex-shrink-0 min-w-0">
            {/* Language Selector */}
            <div className="relative" style={{ zIndex: 10001 }}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center space-x-0.5 sm:space-x-1 bg-red-600 hover:bg-red-700 text-white px-1 sm:px-1.5 md:px-2 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg text-xs font-bold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl border border-white"
                aria-label="Select Language"
              >
                <span className="text-xs sm:text-sm md:text-base">{languages.find(l => l.code === language)?.flag}</span>
                <span className="hidden md:inline text-[10px] md:text-xs font-bold">{languages.find(l => l.code === language)?.nativeName}</span>
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showLanguageMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0"
                    style={{ zIndex: 10001 }}
                    onClick={() => setShowLanguageMenu(false)}
                  />
                  <div
                    className="language-selector-dropdown absolute right-0 mt-2 w-44 sm:w-48 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-2xl overflow-hidden border-2 border-white animate-fade-in"
                    style={{ zIndex: 10002 }}
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguageMenu(false);
                        }}
                        className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-left text-white hover:bg-red-800 transition-colors duration-200 ${language === lang.code ? 'bg-red-800 font-bold' : 'font-medium'
                          }`}
                      >
                        <span className="text-xl sm:text-2xl">{lang.flag}</span>
                        <div className="flex-1">
                          <div className="text-white font-bold text-sm sm:text-base">{lang.nativeName}</div>
                          <div className="text-xs text-red-100 hidden sm:block">{lang.name}</div>
                        </div>
                        {language === lang.code && (
                          <span className="ml-auto text-white text-sm sm:text-base">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Login/Logout Button */}
            {session ? (
              <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-2">
                <span className="text-white text-[10px] sm:text-xs hidden 2xl:inline truncate max-w-[60px] xl:max-w-[80px]">
                  {session.user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-red-600 hover:bg-red-50 px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-0.5 sm:space-x-1">
                <button
                  onClick={handleLogin}
                  className="bg-red-600 hover:bg-red-700 text-white px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-0.5 sm:space-x-1 border border-white whitespace-nowrap"
                >
                  <span className="text-xs sm:text-sm">🔐</span>
                  <span className="hidden sm:inline text-[10px] sm:text-xs">{t.login}</span>
                </button>
                <Link
                  href="/register"
                  className="bg-red-600 hover:bg-red-700 text-white px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-0.5 sm:space-x-1 border border-white whitespace-nowrap"
                >
                  <span className="text-xs sm:text-sm">📝</span>
                  <span className="hidden sm:inline text-[10px] sm:text-xs">Register</span>
                </Link>
              </div>
            )}

            {/* Akrix Solutions Branding */}
            <div className="hidden xl:flex items-center space-x-0.5 xl:space-x-1 animate-pulse flex-shrink-0">
              <span className="text-pink-400 text-xs xl:text-sm animate-bounce">💖</span>
              <a
                href="https://akrixsolutions.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 font-bold text-[10px] xl:text-xs hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 transition-all duration-300 whitespace-nowrap"
              >
                Akrix Solutions
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden text-white p-1 sm:p-1.5 hover:bg-white/10 rounded-md sm:rounded-lg transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden py-3 sm:py-4 border-t border-white/20 animate-fade-in">
            <nav className="flex flex-col space-y-1.5 sm:space-y-2">
              <Link
                href={language === 'en' ? '/about' : `/${language}/about`}
                className="text-white hover:bg-white/10 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                {t.about}
              </Link>
              <Link
                href={language === 'en' ? '/services' : `/${language}/services`}
                className="text-white hover:bg-white/10 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                {t.services}
              </Link>
              <Link
                href="/products"
                className="text-white hover:bg-white/10 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Products
              </Link>
              <Link
                href={language === 'en' ? '/contact' : `/${language}/contact`}
                className="text-white hover:bg-white/10 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                {t.contact}
              </Link>

              {/* Mobile Akrix Branding */}
              <div className="lg:hidden flex items-center justify-center space-x-2 pt-3 sm:pt-4 border-t border-white/20">
                <span className="text-pink-400 text-xs sm:text-sm animate-bounce">💖</span>
                <a
                  href="https://akrixsolutions.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 font-bold text-[10px] sm:text-xs"
                >
                  Akrix Solutions
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
