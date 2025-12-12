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
// Always register in production, check for HTTPS or localhost in development
const canRegisterSW = 'serviceWorker' in navigator && (
  import.meta.env.PROD || 
  window.location.protocol === 'https:' || 
  window.location.hostname === 'localhost'
);

if (canRegisterSW) {
 window.addEventListener('load', async () => {
  try {
   const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none'
   });
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

   // Check for updates every hour
   setInterval(() => {
    registration.update();
   }, 60 * 60 * 1000);

  } catch (error) {
   console.error('[PWA] Service Worker registration failed:', error);
  }
 });
}

createRoot(document.getElementById("root")!).render(<App />);
