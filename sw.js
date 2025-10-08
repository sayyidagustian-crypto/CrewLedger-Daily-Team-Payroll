const CACHE_NAME = 'gaji-borongan-v6'; // Version bumped to trigger update
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon.svg',
  '/manifest.json',
  // Critical dependencies from index.html
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  // Critical dependencies from importmap for React
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client'
];

// Install event: open cache and add assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching app shell and assets');
      return cache.addAll(ASSETS_TO_CACHE).catch(error => {
        console.error('Failed to cache assets during install:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
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
    })
  );
  self.clients.claim();
});

// Fetch event: serve from cache, fall back to network, and cache new assets
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a cached response, return it.
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If not in cache, fetch from the network.
      return fetch(event.request).then(networkResponse => {
        // Clone the response because it's a stream and can only be consumed once.
        const responseToCache = networkResponse.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          // Cache the new response for future offline use.
          // We check if the response is valid before caching.
          if(networkResponse.ok) {
            cache.put(event.request, responseToCache);
          }
        });
        
        return networkResponse;
      }).catch(error => {
        // This will happen if the user is offline and the resource is not cached.
        console.error('Fetch failed; user is likely offline.', event.request.url, error);
        // Let the browser handle the error.
      });
    })
  );
});
