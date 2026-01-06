// Twealth Service Worker for Mobile PWA
// Version 5 - PWABuilder compliant with explicit fetch handling
const CACHE_NAME = 'twealth-v5';
const STATIC_CACHE = 'twealth-static-v5';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline functionality (production-safe paths)
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/welcome',
  '/login',
  '/pricing'
];

// Install event - cache static assets and offline page
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v5...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Failed to cache assets:', error);
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v5...');
  event.waitUntil(
    Promise.all([
      (async () => {
        if (self.registration.navigationPreload) {
          await self.registration.navigationPreload.enable();
          console.log('[SW] Navigation preload enabled');
        }
      })(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - PWABuilder compliant with explicit response handling
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Critical: Never intercept OAuth or API routes - let browser handle normally
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try preload response first (faster)
          const preloadResponse = event.preloadResponse;
          if (preloadResponse) {
            const response = await preloadResponse;
            if (response) return response;
          }

          // Network first for navigation
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.log('[SW] Navigation failed, serving fallback');
          
          // Try cached version
          const cached = await caches.match(request);
          if (cached) return cached;
          
          // Try cached index
          const indexCached = await caches.match('/');
          if (indexCached) return indexCached;
          
          // Return offline page
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
          
          // Ultimate fallback
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body><h1>You are offline</h1></body></html>',
            { headers: { 'Content-Type': 'text/html' }, status: 503 }
          );
        }
      })()
    );
    return;
  }

  // Handle static assets (cache-first strategy)
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        // Update cache in background
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, response));
          }
        }).catch(() => {});
        return cached;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // Return a proper error response for failed static requests
        return new Response('Resource unavailable offline', { 
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
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

// Background sync support
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const keys = await cache.keys();
        for (const req of keys) {
          try {
            const res = await fetch(req);
            if (res.ok) await cache.put(req, res);
          } catch (e) {}
        }
      })
    );
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
