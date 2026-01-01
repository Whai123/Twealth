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

// ==================== PWA REGISTRATION ====================
// TEMPORARILY DISABLED for pre-launch stability
// Re-enable by setting VITE_ENABLE_PWA=true in environment
// See replit.md for full re-enable instructions
const ENABLE_PWA = import.meta.env.VITE_ENABLE_PWA === 'true';

if (ENABLE_PWA && 'serviceWorker' in navigator) {
  console.log('[PWA] PWA is enabled, registering service worker...');
  
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      console.log('[PWA] Service Worker registered successfully:', registration.scope);
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });
} else {
  console.log('[PWA] PWA disabled (VITE_ENABLE_PWA != true). App running as normal website.');
}

createRoot(document.getElementById("root")!).render(<App />);
