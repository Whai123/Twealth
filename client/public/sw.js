// Twealth Service Worker for Mobile PWA
// Version 4 - Enhanced for PWABuilder compliance
const CACHE_NAME = 'twealth-v4';
const STATIC_CACHE = 'twealth-static-v4';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline functionality (production-safe paths)
// Only cache static assets - NO sensitive user data
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
  console.log('[SW] Installing service worker v4...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Failed to cache assets:', error);
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v4...');
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete all old caches including API cache for security
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - implement cache strategies with offline fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external domains
  if (!url.origin.includes(self.location.origin)) {
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
  
  // Handle navigation requests with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Navigation request handler - Network first with offline fallback
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const preloadResponse = await Promise.resolve(event?.preloadResponse);
    if (preloadResponse) {
      return preloadResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, serving offline page');
    
    // Try to return cached version first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try to return cached index
    const indexCache = await caches.match('/');
    if (indexCache) {
      return indexCache;
    }
    
    // Return offline page as last resort
    const offlineCache = await caches.match(OFFLINE_URL);
    if (offlineCache) {
      return offlineCache;
    }
    
    // Create a basic offline response if nothing is cached
    return new Response(
      '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Static request handler - Cache first for performance, network fallback
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached version and update in background
    fetchAndCache(request);
    return cachedResponse;
  }
  
  try {
    return await fetchAndCache(request);
  } catch (error) {
    console.log('[SW] Static fetch failed:', request.url);
    throw error;
  }
}

// Fetch and cache helper
async function fetchAndCache(request) {
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
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

// Periodic background sync for keeping data fresh
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

async function updateCache() {
  const cache = await caches.open(STATIC_CACHE);
  const keys = await cache.keys();
  
  for (const request of keys) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
      }
    } catch (error) {
      // Ignore failed updates
    }
  }
}

// Push notification support (placeholder for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from Twealth',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Twealth', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
