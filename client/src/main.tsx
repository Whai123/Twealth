import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // Initialize i18n

// Register service worker for PWA functionality
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service Worker registered successfully:', registration.scope);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('[PWA] New version available. Refresh to update.');
              if (confirm('A new version of Twealth is available. Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });
}

// Development service worker registration for testing
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA-DEV] Service Worker registered for development:', registration.scope);
    } catch (error) {
      console.log('[PWA-DEV] Service Worker registration failed (normal in dev):', error);
    }
  });
}

console.log('=== STARTING REACT APP ===');

try {
  const root = createRoot(document.getElementById("root")!);
  console.log('=== ROOT CREATED ===');
  root.render(<App />);
  console.log('=== APP RENDERED ===');
} catch (error) {
  console.error('=== FAILED TO START APP ===', error);
}
