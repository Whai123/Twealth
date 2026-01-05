// Twealth Service Worker - KILL SWITCH v3
// This SW self-destructs AND FORCES A RELOAD to get fresh HTML
// This is the FIX for iOS Safari users stuck on old cached HTML

const KILL_SWITCH_VERSION = 'kill-v3';

// Install: Skip waiting immediately to take control ASAP
self.addEventListener('install', (event) => {
  console.log('[SW Kill-Switch v3] Installing...');
  self.skipWaiting();
});

// Activate: Delete all caches, unregister, AND FORCE RELOAD WITH CACHE-BUSTER
self.addEventListener('activate', (event) => {
  console.log('[SW Kill-Switch v3] Activating - cleaning up and FORCING RELOAD...');
  
  event.waitUntil((async () => {
    try {
      // Step 1: Take control of all clients
      await self.clients.claim();
      console.log('[SW Kill-Switch v3] Claimed all clients');
      
      // Step 2: Delete ALL caches
      const cacheNames = await caches.keys();
      console.log('[SW Kill-Switch v3] Deleting', cacheNames.length, 'caches');
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[SW Kill-Switch v3] All caches deleted');
      
      // Step 3: Unregister this service worker
      const unregistered = await self.registration.unregister();
      console.log('[SW Kill-Switch v3] Unregistered:', unregistered);
      
      // Step 4: FORCE RELOAD ALL CLIENTS with cache-buster
      // This is the KEY FIX - forces browser to fetch fresh HTML
      const clients = await self.clients.matchAll({ type: 'window' });
      console.log('[SW Kill-Switch v3] Forcing reload for', clients.length, 'clients');
      
      for (const client of clients) {
        try {
          const url = new URL(client.url);
          url.searchParams.set('v', Date.now().toString());
          client.navigate(url.toString());
        } catch (e) {
          console.error('[SW Kill-Switch v3] Navigate failed:', e);
        }
      }
      
      console.log('[SW Kill-Switch v3] Cleanup complete - reload triggered');
    } catch (error) {
      console.error('[SW Kill-Switch v3] Error:', error);
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
  console.log('[SW Kill-Switch v3] Message:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: KILL_SWITCH_VERSION, isKillSwitch: true });
  }
});
