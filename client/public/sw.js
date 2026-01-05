// Twealth Service Worker - KILL SWITCH v2
// This SW self-destructs WITHOUT causing page reloads
// It replaces old SWs, clears all caches, and unregisters itself silently

const KILL_SWITCH_VERSION = 'kill-v2';

// Install: Skip waiting immediately to take control ASAP
self.addEventListener('install', (event) => {
  console.log('[SW Kill-Switch v2] Installing...');
  self.skipWaiting();
});

// Activate: Delete all caches and unregister self - NO NAVIGATION/RELOAD
self.addEventListener('activate', (event) => {
  console.log('[SW Kill-Switch v2] Activating - cleaning up silently...');
  
  event.waitUntil((async () => {
    try {
      // Step 1: Take control of all clients
      await self.clients.claim();
      console.log('[SW Kill-Switch v2] Claimed all clients');
      
      // Step 2: Delete ALL caches
      const cacheNames = await caches.keys();
      console.log('[SW Kill-Switch v2] Deleting', cacheNames.length, 'caches');
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[SW Kill-Switch v2] All caches deleted');
      
      // Step 3: Unregister this service worker - NO PAGE RELOAD
      const unregistered = await self.registration.unregister();
      console.log('[SW Kill-Switch v2] Unregistered:', unregistered);
      
      // Step 4: Just notify clients that SW is gone (no navigation!)
      // This allows the page to continue working without any reload
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        client.postMessage({ 
          type: 'SW_KILLED', 
          version: KILL_SWITCH_VERSION,
          message: 'Service worker cleaned up silently'
        });
      });
      
      console.log('[SW Kill-Switch v2] Cleanup complete - no reload triggered');
    } catch (error) {
      console.error('[SW Kill-Switch v2] Error:', error);
    }
  })());
});

// Fetch: NEVER intercept - let everything go to network
self.addEventListener('fetch', (event) => {
  // Do nothing - let browser handle all fetches normally
  return;
});

// Message handler
self.addEventListener('message', (event) => {
  console.log('[SW Kill-Switch v2] Message:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: KILL_SWITCH_VERSION, isKillSwitch: true });
  }
});
