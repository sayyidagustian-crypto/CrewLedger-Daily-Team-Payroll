
const CACHE_NAME = 'crewledger-pwa-v18'; // Version incremented to ensure update
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/index.tsx',
  // importmap dependencies
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://aistudiocdn.com/jspdf@^2.5.1',
  'https://aistudiocdn.com/jspdf-autotable@^3.8.2',
  'https://aistudiocdn.com/docx@^8.5.0',
  'https://aistudiocdn.com/file-saver@^2.0.5',
];

// Install event: cache all essential App Shell assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell...');
        // Using addAll is atomic and simpler.
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Caching failed:', error);
      })
  );
});

// Activate event: clean up old caches.
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
    }).then(() => self.clients.claim())
  );
});

// Fetch event: handle requests and serve from cache or network.
self.addEventListener('fetch', (event) => {
  // For SPA navigation requests (e.g., page reloads, direct navigation).
  // Try network first. If it fails, serve the cached app shell from root.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // For all other requests (assets, APIs), use a "Cache first, falling back to network" strategy.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return from cache if found.
        if (response) {
          return response;
        }

        // If not in cache, fetch from network.
        return fetch(event.request).then((networkResponse) => {
            // Check if we received a valid response to cache.
            // We only cache GET requests that are successful or opaque (from CDNs).
            if (event.request.method === 'GET' && networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              // IMPORTANT: Clone the response. A response is a stream
              // and must be cloned to be consumed by both the browser and the cache.
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          }
        );
      })
  );
});
