'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Language, defaultLanguage, getLanguageFromPath, getLocalizedPath } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  useEffect(() => {
    // Get language from URL path
    const langFromPath = getLanguageFromPath(pathname);
    setLanguageState(langFromPath);
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', langFromPath);
    }
  }, [pathname]);

  const setLanguage = (lang: Language) => {
    // Get current path without language prefix
    const currentPath = pathname.replace(/^\/(mr|hi)/, '') || '/';
    
    // Create new path with language prefix
    const newPath = getLocalizedPath(currentPath, lang);
    
    // Store preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', lang);
    }
    
    // Navigate to new path
    router.push(newPath);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
