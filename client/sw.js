// Twealth Service Worker for Mobile PWA
const CACHE_NAME = 'twealth-v1';
const STATIC_CACHE = 'twealth-static-v1';
const API_CACHE = 'twealth-api-v1';

// Assets to cache for offline functionality (production-safe paths)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/welcome'
];

// API endpoints to cache for offline access
const API_ENDPOINTS = [
  '/api/dashboard/stats',
  '/api/dashboard/time-stats',
  '/api/users/me',
  '/api/events/upcoming',
  '/api/financial-goals',
  '/api/groups',
  '/api/transactions',
  '/api/insights/time-value',
  '/api/user-preferences',
  '/api/subscription/usage',
  '/api/subscription/current',
  '/api/referrals/stats'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
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
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// API request handler - Network first, cache fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for offline access
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`HTTP ${networkResponse.status}`);
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving API from cache:', url.pathname);
      return cachedResponse;
    }
    
    // Return offline response for critical endpoints
    return createOfflineResponse(url.pathname);
  }
}

// Static request handler - Cache first, network fallback
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response for future use
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for static request:', request.url);
    
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

// Create offline responses for API endpoints
function createOfflineResponse(pathname) {
  const offlineData = getOfflineData(pathname);
  
  return new Response(JSON.stringify(offlineData), {
    status: 200,
    statusText: 'OK (Offline)',
    headers: {
      'Content-Type': 'application/json',
      'X-Offline': 'true'
    }
  });
}

// Offline fallback data for API endpoints
function getOfflineData(pathname) {
  const offlineResponses = {
    '/api/dashboard/stats': {
      totalSavings: 0,
      activeGoals: '0',
      monthlyIncome: 0,
      monthlyExpenses: 0,
      offline: true
    },
    '/api/dashboard/time-stats': {
      totalTimeHours: 0,
      timeValue: 0,
      avgHourlyRate: 0,
      weeklyTimeHours: 0,
      offline: true
    },
    '/api/users/me': {
      id: 'offline-user',
      name: 'Offline User',
      email: 'offline@example.com',
      hourlyRate: 0,
      offline: true
    },
    '/api/events/upcoming': [],
    '/api/financial-goals': [],
    '/api/groups': [],
    '/api/transactions': [],
    '/api/insights/time-value': {
      totalTimeHours: 0,
      timeValue: 0,
      avgHourlyRate: 0,
      monthlyTimeHours: 0,
      offline: true
    }
  };
  
  return offlineResponses[pathname] || { message: 'Offline mode', offline: true };
}

// Background sync for offline actions (when supported)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'time-tracking-sync') {
    event.waitUntil(syncTimeTrackingData());
  }
});

// Sync offline time tracking data when back online
async function syncTimeTrackingData() {
  try {
    // This would sync any offline time tracking data
    // Implementation depends on how offline data is stored
    console.log('[SW] Syncing time tracking data...');
  } catch (error) {
    console.error('[SW] Failed to sync time tracking data:', error);
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
});