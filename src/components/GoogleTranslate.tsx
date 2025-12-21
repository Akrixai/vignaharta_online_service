'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: () => void;
    }
}

export default function GoogleTranslate() {
    const { language } = useLanguage();

    useEffect(() => {
        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,mr,bn,gu,kn,ml,pa,ta,te,ur,or,as,mai,sa,gom,doi,sd,mni-Mtei,sat',
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                },
                'google_translate_element'
            );
        };
    }, []);

    useEffect(() => {
        const translatePage = (lang: string) => {
            const googleTranslateCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (googleTranslateCombo) {
                googleTranslateCombo.value = lang;
                googleTranslateCombo.dispatchEvent(new Event('change'));
            }
        };

        if (language) {
            // Small delay to ensure Google Translate combo is available
            const timer = setTimeout(() => {
                translatePage(language);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [language]);

    return (
        <>
            <div id="google_translate_element" style={{ display: 'none' }}></div>
            <Script
                src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
                strategy="afterInteractive"
            />
            <style jsx global>{`
        .goog-te-banner-frame.skiptranslate, .goog-te-gadget-icon {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        .goog-te-menu-value {
          display: none !important;
        }
        .goog-te-gadget {
          display: none !important;
        }
        .goog-tooltip {
          display: none !important;
        }
        .goog-tooltip:hover {
          display: none !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
        </>
    );
}
