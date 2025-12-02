import { createRoot } from"react-dom/client";
import App from"./App";
import"./index.css";
import"./i18n"; // Initialize i18n

// Mobile viewport height fix for iOS Safari
// This sets a CSS variable --vh that represents 1% of the actual viewport height
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set on load and resize
setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => {
  // Small delay to ensure the browser has updated the dimensions
  setTimeout(setViewportHeight, 100);
});

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

createRoot(document.getElementById("root")!).render(<App />);
