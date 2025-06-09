"use client"

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' && 
      'serviceWorker' in navigator && 
      process.env.NODE_ENV === 'production' // Only in production
    ) {
      console.log('Attempting to register service worker...');
      
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('Service worker update found!');
            
            newWorker?.addEventListener('statechange', () => {
              console.log('Service worker state:', newWorker.state);
            });
          });
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed:', error);
        });

      // Handle service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated!');
      });
    } else {
      console.log('Service worker registration skipped:', {
        isWindow: typeof window !== 'undefined',
        hasServiceWorker: 'serviceWorker' in navigator,
        isProduction: process.env.NODE_ENV === 'production'
      });
    }
  }, []);

  return null; // This component doesn't render anything
}