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
 // Guard against reload loops - only reload once per session
 const SW_RELOAD_KEY = 'sw-reload-guard';
 const lastReload = sessionStorage.getItem(SW_RELOAD_KEY);
 const now = Date.now();
 const canReload = !lastReload || (now - parseInt(lastReload, 10)) > 10000; // 10 second cooldown

 // Listen for SW update messages and auto-reload to prevent stale bundles
 navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data?.type === 'SW_UPDATED' && canReload) {
   console.log('[PWA] Service Worker updated to', event.data.version, '- reloading...');
   sessionStorage.setItem(SW_RELOAD_KEY, now.toString());
   window.location.reload();
  }
 });

 // When SW controller changes (new SW takes over), reload to get fresh code
 navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (canReload) {
   console.log('[PWA] New Service Worker controller - reloading for fresh code...');
   sessionStorage.setItem(SW_RELOAD_KEY, now.toString());
   window.location.reload();
  }
 });

 window.addEventListener('load', async () => {
  try {
   const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none'
   });
   console.log('[PWA] Service Worker registered successfully:', registration.scope);
   
   // Handle updates - auto-activate new SW
   registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (newWorker) {
     newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
       console.log('[PWA] New version installed, activating...');
       // Tell new SW to skip waiting and take over
       newWorker.postMessage({ type: 'SKIP_WAITING' });
      }
     });
    }
   });

   // Check for updates every 15 minutes (more frequent for faster fixes)
   setInterval(() => {
    registration.update();
   }, 15 * 60 * 1000);

  } catch (error) {
   console.error('[PWA] Service Worker registration failed:', error);
  }
 });
}

createRoot(document.getElementById("root")!).render(<App />);
