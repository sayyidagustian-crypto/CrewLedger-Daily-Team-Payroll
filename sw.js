
const CACHE_NAME = 'gaji-borongan-v17'; // Version increased to fix PWA
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon.svg',
  '/manifest.json',
  // Critical CDN dependencies from importmap and HTML
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client', // This is the resolved path for react-dom/client
  'https://aistudiocdn.com/jspdf@^2.5.1',
  'https://aistudiocdn.com/jspdf-autotable@^3.8.2',
  'https://aistudiocdn.com/docx@^8.5.0',
  'https://aistudiocdn.com/file-saver@^2.0.5',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Event install: cache all essential App Shell assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('Service Worker: Caching App Shell...');
        
        for (const url of APP_SHELL_URLS) {
          try {
            // Use cache: 'reload' to bypass HTTP cache and fetch fresh from the network.
            const request = new Request(url, { cache: 'reload' });
            const response = await fetch(request);
            
            if (!response.ok) {
              // If any essential asset fails to fetch, fail the entire installation.
              throw new Error(`Failed to fetch ${url}: status ${response.status}`);
            }
            
            await cache.put(request, response.clone());
            console.log(`Service Worker: Cached -> ${url}`);
          } catch (error) {
            console.error(`Service Worker: Failed to cache -> ${url}. Installation will fail.`, error);
            // Re-throw to make the installation fail. The app can't work offline without these assets.
            throw error;
          }
        }
        
        console.log('Service Worker: App Shell cached successfully. Activating...');
        // Force the waiting service worker to become the active service worker.
        await self.skipWaiting();
      } catch (error) {
        console.error('Service Worker: Installation failed due to caching error.', error);
      }
    })()
  );
});

// Event activate: clean up old caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients.
  );
});

// Event fetch: serve cached assets or fetch from network.
self.addEventListener('fetch', (event) => {
  // We only handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);

  // Strategy for SPA navigation (e.g., page reloads, direct navigation).
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first.
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // If network fails, serve the main app shell from cache.
          console.log('Navigation failed, serving /index.html from cache.');
          const cache = await caches.open(CACHE_NAME);
          // The fallback to `/index.html` is crucial for SPAs.
          return await cache.match('/index.html');
        }
      })()
    );
    return;
  }

  // Strategy for App Shell assets (Cache first, then network).
  // This is for assets we've explicitly pre-cached.
  const isAppShellUrl = APP_SHELL_URLS.some(path => {
      // Handle local paths like '/', '/index.html'
      if (path.startsWith('/') || path.startsWith('./')) {
          return url.pathname === path.substring(path.startsWith('./') ? 1 : 0);
      }
      // Handle full URLs like 'https://cdn.tailwindcss.com'
      return event.request.url === path;
  });

  if (isAppShellUrl) {
    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        try {
            const networkResponse = await fetch(event.request);
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
        } catch (error) {
            console.error('Fetch failed from network for app shell URL:', event.request.url, error);
        }
      })()
    );
    return;
  }

  // Strategy for other assets (e.g., fonts from Google Fonts CSS)
  // Network first, falling back to cache. This keeps them updated but provides offline access.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const networkResponse = await fetch(event.request);
        // If fetch is successful, update the cache.
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      } catch (error) {
        // If network fails, try to serve from cache.
        const cachedResponse = await caches.match(event.request);
        return cachedResponse;
      }
    })()
  );
});
