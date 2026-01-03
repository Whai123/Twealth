// Twealth Service Worker - KILL SWITCH
// This SW self-destructs to fix iOS Safari PWA infinite loop issue
// It replaces the old SW, clears all caches, unregisters itself, and reloads clients

const KILL_SWITCH_VERSION = 'kill-v1';

// Install: Skip waiting immediately to take control ASAP
self.addEventListener('install', (event) => {
  console.log('[SW Kill-Switch] Installing...');
  self.skipWaiting();
});

// Activate: Delete all caches, unregister self, reload all clients
self.addEventListener('activate', (event) => {
  console.log('[SW Kill-Switch] Activating - initiating self-destruct sequence...');
  
  event.waitUntil((async () => {
    try {
      // Step 1: Take control of all clients immediately
      await self.clients.claim();
      console.log('[SW Kill-Switch] Claimed all clients');
      
      // Step 2: Delete ALL caches (no exceptions)
      const cacheNames = await caches.keys();
      console.log('[SW Kill-Switch] Deleting', cacheNames.length, 'caches:', cacheNames);
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[SW Kill-Switch] All caches deleted');
      
      // Step 3: Unregister this service worker
      const unregistered = await self.registration.unregister();
      console.log('[SW Kill-Switch] Unregistered:', unregistered);
      
      // Step 4: Navigate all clients to reload with fresh content
      const clients = await self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      console.log('[SW Kill-Switch] Reloading', clients.length, 'clients');
      
      // Use navigate() to force a hard reload that bypasses any cache
      clients.forEach(client => {
        try {
          // Add cache-bust param to ensure fresh fetch
          const url = new URL(client.url);
          url.searchParams.set('_sw_killed', Date.now().toString());
          client.navigate(url.href);
        } catch (e) {
          console.log('[SW Kill-Switch] Client navigate failed, trying postMessage:', e);
          client.postMessage({ 
            type: 'SW_KILLED', 
            action: 'RELOAD',
            version: KILL_SWITCH_VERSION 
          });
        }
      });
      
      console.log('[SW Kill-Switch] Self-destruct complete!');
    } catch (error) {
      console.error('[SW Kill-Switch] Error during self-destruct:', error);
      // Even if something fails, try to reload clients
      try {
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({ type: 'SW_KILLED', action: 'RELOAD' });
        });
      } catch (e) {
        console.error('[SW Kill-Switch] Failed to notify clients:', e);
      }
    }
  })());
});

// Fetch: NEVER intercept - let everything go to network
// This ensures even if activation is delayed, we don't serve stale content
self.addEventListener('fetch', (event) => {
  // Explicitly do nothing - let browser handle all fetches normally
  return;
});

// Message handler: respond to kill commands from the page
self.addEventListener('message', (event) => {
  console.log('[SW Kill-Switch] Received message:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: KILL_SWITCH_VERSION, isKillSwitch: true });
  }
  
  if (event.data?.type === 'FORCE_KILL') {
    // Emergency kill - immediately unregister and reload
    self.registration.unregister().then(() => {
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.navigate(client.url));
      });
    });
  }
});
