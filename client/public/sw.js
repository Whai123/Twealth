// Twealth Service Worker - DISABLED
// This is a no-op service worker that does nothing
// It exists only to replace any previously installed service workers

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Do nothing - let browser handle all requests normally
});
