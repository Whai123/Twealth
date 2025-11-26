// Twealth Service Worker for Mobile PWA
const CACHE_NAME = 'twealth-v3';
const STATIC_CACHE = 'twealth-static-v3';

// Assets to cache for offline functionality (production-safe paths)
// Only cache static assets - NO sensitive user data
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/welcome',
  '/login',
  '/pricing'
];

// Install event - cache static assets only
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete all old caches including API cache for security
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external domains
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }
  
  // CRITICAL: Never intercept OAuth authentication routes
  if (url.pathname.startsWith('/api/auth/')) {
    return;
  }
  
  // SECURITY: Never cache or intercept authenticated API requests
  // All /api/* requests go directly to network - no caching of sensitive data
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Handle static assets only
  event.respondWith(handleStaticRequest(request));
});

// Static request handler - Cache first for performance, network fallback
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // For navigation requests, return the cached index.html (SPA fallback)
    if (request.mode === 'navigate') {
      const indexCache = await caches.match('/');
      if (indexCache) {
        return indexCache;
      }
    }
    
    throw error;
  }
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  // Allow clearing all caches for security
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});
