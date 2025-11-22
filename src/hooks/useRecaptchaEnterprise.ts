import { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export function useRecaptchaEnterprise() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const siteKey = '6LeYPwksAAAAAPH-jIsASA6II6ljU4vKi5vIOf3p';

  useEffect(() => {
    // Check if already loaded
    if (window.grecaptcha && window.grecaptcha.enterprise) {
      window.grecaptcha.enterprise.ready(() => {
        setIsReady(true);
      });
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="recaptcha/enterprise.js"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.grecaptcha && window.grecaptcha.enterprise) {
          window.grecaptcha.enterprise.ready(() => {
            setIsReady(true);
          });
        }
      });
      return;
    }

    // Load reCAPTCHA Enterprise script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
    script.async = true;
    
    script.onload = () => {
      if (window.grecaptcha && window.grecaptcha.enterprise) {
        window.grecaptcha.enterprise.ready(() => {
          console.log('reCAPTCHA Enterprise ready');
          setIsReady(true);
          setError(null);
        });
      } else {
        setError('reCAPTCHA failed to initialize');
      }
    };

    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
      setError('Failed to load reCAPTCHA');
      setIsReady(true); // Allow form submission even if reCAPTCHA fails
    };

    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      // Don't remove script as it might be used by other components
    };
  }, [siteKey]);

  const executeRecaptcha = useCallback(async (action: string): Promise<string> => {
    if (error) {
      console.warn('reCAPTCHA error, skipping:', error);
      return '';
    }

    if (!window.grecaptcha || !window.grecaptcha.enterprise) {
      console.warn('reCAPTCHA not loaded, skipping');
      return '';
    }

    try {
      const token = await window.grecaptcha.enterprise.execute(siteKey, { action });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution error:', error);
      return '';
    }
  }, [siteKey, error]);

  return {
    isReady,
    executeRecaptcha,
    error,
  };
}
