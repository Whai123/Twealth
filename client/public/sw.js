// Twealth Service Worker v6
// Network-first for HTML, cache-first for static assets only
// NEVER cache HTML to prevent stale bundle reference issues
const CACHE_NAME = 'twealth-v6';
const STATIC_CACHE = 'twealth-static-v6';
const OFFLINE_URL = '/offline.html';

// Only cache truly static assets - NO HTML pages
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

// Install - cache only static assets, never HTML
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v6...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Install failed:', err);
        return self.skipWaiting();
      })
  );
});

// Activate - clean ALL old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v6...');
  event.waitUntil(
    Promise.all([
      // Delete ALL old caches
      caches.keys().then((names) => 
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting cache:', name);
              return caches.delete(name);
            })
        )
      ),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // NEVER intercept API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation requests (HTML) - ALWAYS network first, NEVER cache HTML
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Only serve offline page when truly offline
          return caches.match(OFFLINE_URL) || new Response(
            '<html><body><h1>Offline</h1><p>Please check your connection.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' }, status: 503 }
          );
        })
    );
    return;
  }

  // Static assets (JS, CSS, images) - cache first for performance
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Stale-while-revalidate: return cached, update in background
        fetch(request).then((res) => {
          if (res.ok) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, res));
          }
        }).catch(() => {});
        return cached;
      }

      // Not cached - fetch and cache
      return fetch(request).then((response) => {
        // Only cache successful responses for static assets
        if (response.ok && (
          url.pathname.startsWith('/assets/') || 
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.css') ||
          url.pathname.endsWith('.png') ||
          url.pathname.endsWith('.ico') ||
          url.pathname.endsWith('.woff2')
        )) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Message handler
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_ALL') {
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))));
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Twealth', {
      body: data.body || 'New notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
