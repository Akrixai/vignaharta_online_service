'use client';

import { useEffect } from 'react';

export default function TawkToChat() {
  useEffect(() => {
    // Initialize Tawk_API
    if (typeof window !== 'undefined') {
      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_LoadStart = new Date();
    }

    // Create and load Tawk.to script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://embed.tawk.to/69287e1c44be881965368d41/1jb32p8t3';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    // Insert script into document
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Cleanup function to remove script when component unmounts
    return () => {
      // Remove the Tawk.to widget
      const tawkWidget = document.getElementById('tawkchat-container');
      if (tawkWidget) {
        tawkWidget.remove();
      }
      
      // Remove the script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      // Clean up Tawk API
      if (typeof window !== 'undefined') {
        delete (window as any).Tawk_API;
        delete (window as any).Tawk_LoadStart;
      }
    };
  }, []);

  return null; // This component doesn't render anything visible - Tawk.to creates its own widget
}
