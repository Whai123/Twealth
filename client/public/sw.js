// Twealth Service Worker for Mobile PWA
// Version 7 - NEVER cache HTML or JS to prevent stale bundle errors
const CACHE_NAME = 'twealth-v7';
const STATIC_CACHE = 'twealth-static-v7';
const OFFLINE_URL = '/offline.html';

// Only cache truly static assets - NO HTML, NO JS
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

// Install event - delete only OLD caches, then cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW v7] Installing...');
  event.waitUntil(
    // First delete old caches (anything not v7)
    caches.keys()
      .then((cacheNames) => {
        const oldCaches = cacheNames.filter(name => !name.includes('-v7'));
        console.log('[SW v7] Deleting old caches:', oldCaches);
        return Promise.all(oldCaches.map((name) => caches.delete(name)));
      })
      .then(() => caches.open(STATIC_CACHE))
      .then((cache) => {
        console.log('[SW v7] Caching essential static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[SW v7] Install complete, skipping waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW v7] Install error:', error);
        return self.skipWaiting();
      })
  );
});

// Activate event - take control immediately and notify clients
self.addEventListener('activate', (event) => {
  console.log('[SW v7] Activating...');
  event.waitUntil(
    Promise.all([
      // Enable navigation preload if available
      (async () => {
        if (self.registration.navigationPreload) {
          await self.registration.navigationPreload.enable();
          console.log('[SW v7] Navigation preload enabled');
        }
      })(),
      // Delete any remaining old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
            .map((name) => {
              console.log('[SW v7] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ]).then(() => {
      // Notify all clients that SW was updated - they should reload
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: 'v7' });
        });
      });
    })
  );
});

// Fetch event - NETWORK ONLY for HTML and JS, cache only static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // NEVER intercept API routes
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // CRITICAL: Never cache or intercept JavaScript bundles
  if (url.pathname.endsWith('.js') || url.pathname.includes('/assets/')) {
    return; // Let browser handle directly
  }

  // CRITICAL: Never cache navigation (HTML) - always get fresh from network
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try preload response first
          const preloadResponse = event.preloadResponse;
          if (preloadResponse) {
            const response = await preloadResponse;
            if (response) return response;
          }

          // Always fetch fresh HTML from network - NO CACHING
          const networkResponse = await fetch(request, { cache: 'no-store' });
          return networkResponse;
        } catch (error) {
          console.log('[SW v7] Navigation failed, serving offline page');
          
          // Return offline page only when truly offline
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
          
          // Ultimate fallback
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}h1{color:#333}</style></head><body><h1>You are offline</h1></body></html>',
            { headers: { 'Content-Type': 'text/html' }, status: 503 }
          );
        }
      })()
    );
    return;
  }

  // Only cache static assets (icons, manifest, etc.)
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset.split('/').pop()))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // For everything else, let browser handle normally (no interception)
});

// Message handler
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_NAME });
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))));
  }
});

// Push notification support
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Twealth', {
      body: data.body || 'New notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' }
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return clients.openWindow?.(url);
    })
  );
});
