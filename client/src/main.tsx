import { createRoot } from"react-dom/client";
import App from"./App";
import"./index.css";
import"./i18n"; // Initialize i18n

// App version - increment on each deploy to bust caches
const APP_VERSION = '5.0.0';

// Mobile viewport height fix for iOS Safari
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => {
  setTimeout(setViewportHeight, 100);
});

// Clear all caches and unregister service workers
async function clearAllCaches() {
  console.log('[CacheBuster] Clearing all caches...');
  
  // Clear all Cache Storage
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[CacheBuster] Cleared', cacheNames.length, 'caches');
  }
  
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
    console.log('[CacheBuster] Unregistered', registrations.length, 'service workers');
  }
}

// Check for version mismatch and clear caches if needed
async function checkVersionAndClearIfNeeded() {
  const storedVersion = localStorage.getItem('twealth_version');
  
  if (storedVersion !== APP_VERSION) {
    console.log('[CacheBuster] Version mismatch:', storedVersion, '->', APP_VERSION);
    await clearAllCaches();
    localStorage.setItem('twealth_version', APP_VERSION);
    
    // Only reload if we actually cleared something and aren't in a reload loop
    const reloadCount = parseInt(sessionStorage.getItem('reload_count') || '0');
    if (reloadCount < 2) {
      sessionStorage.setItem('reload_count', String(reloadCount + 1));
      window.location.reload();
      return false;
    }
  }
  
  // Reset reload counter on successful load
  sessionStorage.removeItem('reload_count');
  return true;
}

// Register service worker for PWA functionality
const canRegisterSW = 'serviceWorker' in navigator && (
  import.meta.env.PROD || 
  window.location.protocol === 'https:' || 
  window.location.hostname === 'localhost'
);

async function registerServiceWorker() {
  if (!canRegisterSW) return;
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    console.log('[PWA] Service Worker registered:', registration.scope);
    
    // Force immediate activation of new service worker
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New version - force skip waiting
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              console.log('[PWA] New version installed, refreshing...');
              window.location.reload();
            }
          }
        });
      }
    });

    // Check for updates frequently
    setInterval(() => registration.update(), 30 * 60 * 1000);

  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
  }
}

// Initialize app
async function init() {
  const shouldContinue = await checkVersionAndClearIfNeeded();
  if (!shouldContinue) return;
  
  // Register service worker after cache check
  window.addEventListener('load', registerServiceWorker);
  
  // Render app
  createRoot(document.getElementById("root")!).render(<App />);
}

init();
