'use client';

import { useEffect } from 'react';

interface ChaportChatProps {
  appId: string;
}

declare global {
  interface Window {
    chaportConfig?: {
      appId: string;
      alignment?: string;
      launcher?: {
        position?: string;
      };
    };
    chaport?: any;
  }
}

export default function ChaportChat({ appId }: ChaportChatProps) {
  useEffect(() => {
    // Validate appId
    if (!appId || appId === '') {
      console.error('Chaport: App ID is missing');
      return;
    }

    // Check if Chaport is already loaded
    if (window.chaport) {
      console.log('Chaport: Already loaded');
      return;
    }

    // Set Chaport configuration with right alignment
    window.chaportConfig = {
      appId: appId,
      alignment: 'right', // Position on right side
    };

    console.log('Chaport: Initializing with App ID:', appId);

    // Initialize Chaport object
    const chaport: any = {};
    chaport._q = [];
    chaport._l = {};
    chaport.q = function(...args: any[]) {
      chaport._q.push(args);
    };
    chaport.on = function(e: string, fn: Function) {
      if (!chaport._l[e]) chaport._l[e] = [];
      chaport._l[e].push(fn);
    };
    window.chaport = chaport;

    // Load Chaport script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://app.chaport.com/javascripts/insert.js';
    
    script.onload = () => {
      console.log('Chaport: Script loaded successfully');
      
      // Wait for Chaport to fully initialize, then apply positioning
      setTimeout(() => {
        // Additional CSS to ensure right positioning with higher specificity
        const style = document.createElement('style');
        style.innerHTML = `
          /* Chaport launcher button positioning */
          #chaport-launcher,
          div[id^="chaport-launcher"],
          .chaport-launcher {
            right: 20px !important;
            left: auto !important;
            bottom: 20px !important;
          }
          
          /* Chaport chat window positioning */
          #chaport-container,
          div[id^="chaport-container"],
          .chaport-container,
          #chaport-window,
          div[id^="chaport-window"],
          .chaport-window {
            right: 20px !important;
            left: auto !important;
            bottom: 80px !important;
          }
          
          /* Chaport iframe positioning */
          iframe[id*="chaport"],
          iframe[src*="chaport"] {
            right: 0 !important;
            left: auto !important;
          }
          
          /* Force all Chaport elements to right side */
          [class*="chaport"],
          [id*="chaport"] {
            right: 20px !important;
            left: auto !important;
          }
        `;
        document.head.appendChild(style);
      }, 500);
    };
    
    script.onerror = () => {
      console.error('Chaport: Failed to load script');
    };

    // Insert script into document
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      console.log('Chaport: Cleaning up');
      // Remove Chaport widget on unmount
      const chaportWidget = document.getElementById('chaport-container');
      if (chaportWidget) {
        chaportWidget.remove();
      }
      // Remove script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Clear window objects
      delete window.chaport;
      delete window.chaportConfig;
    };
  }, [appId]);

  return null; // This component doesn't render anything visible
}
