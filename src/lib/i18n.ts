// Internationalization configuration and utilities

export type Language = 'en' | 'mr' | 'hi';

export const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
];

export const defaultLanguage: Language = 'en';

export function getLanguageFromPath(pathname: string): Language {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment === 'mr' || firstSegment === 'hi') {
    return firstSegment as Language;
  }
  
  return defaultLanguage;
}

export function getLocalizedPath(path: string, lang: Language): string {
  // Remove any existing language prefix
  const cleanPath = path.replace(/^\/(mr|hi)/, '');
  
  // Add language prefix if not English
  if (lang === 'en') {
    return cleanPath || '/';
  }
  
  return `/${lang}${cleanPath || ''}`;
}
