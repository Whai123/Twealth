// Twealth Service Worker for Mobile PWA
// Version 6 - Aggressive cache clearing to fix stale asset issues
const CACHE_NAME = 'twealth-v6';
const STATIC_CACHE = 'twealth-static-v6';
const OFFLINE_URL = '/offline.html';

// Only cache truly static assets - NOT dynamic app routes
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

// Install event - FIRST clear ALL old caches, then cache only essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v6...');
  event.waitUntil(
    // Clear ALL existing caches first to prevent stale JS issues
    caches.keys()
      .then((cacheNames) => {
        console.log('[SW] Clearing all old caches:', cacheNames);
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      })
      .then(() => caches.open(STATIC_CACHE))
      .then((cache) => {
        console.log('[SW] Caching essential static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Install error:', error);
        return self.skipWaiting();
      })
  );
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v6...');
  event.waitUntil(
    Promise.all([
      (async () => {
        if (self.registration.navigationPreload) {
          await self.registration.navigationPreload.enable();
          console.log('[SW] Navigation preload enabled');
        }
      })(),
      // Clear any remaining old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
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

  // CRITICAL: Never cache JavaScript bundles - always fetch fresh to prevent stale code
  if (url.pathname.endsWith('.js') || url.pathname.includes('/assets/')) {
    return; // Let browser handle JS files directly - no caching
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
