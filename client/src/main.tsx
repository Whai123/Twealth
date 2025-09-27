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

// TEMPORARY: Bypass all React components to test if caching is the issue
const rootElement = document.getElementById("root")!;
rootElement.innerHTML = `
  <div style="background: red; color: white; padding: 30px; font-family: Arial;">
    <h1>DIRECT HTML TEST - NO REACT</h1>
    <p>This bypasses all React components, PWA caching, and service workers.</p>
    <p>Timestamp: ${new Date().toISOString()}</p>
    <button onclick="alert('Button works!')">Test Button</button>
    <div style="margin-top: 20px; font-size: 14px;">
      If you can see this, the server is working and the issue was with React/PWA caching.
    </div>
  </div>
`;

// COMMENTED OUT ORIGINAL:
// createRoot(document.getElementById("root")!).render(<App />);
