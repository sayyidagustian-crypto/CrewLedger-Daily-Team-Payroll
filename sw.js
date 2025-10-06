const CACHE_NAME = 'gaji-borongan-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon.svg',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Install event: open cache and add assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching assets');
      // Use addAll to cache all assets, but handle potential individual failures gracefully if needed
      const promises = ASSETS_TO_CACHE.map(url => {
        return cache.add(url).catch(err => {
          console.warn(`Failed to cache ${url}:`, err);
        });
      });
      return Promise.all(promises);
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If we have a cached response, return it.
      if (response) {
        return response;
      }
      // Otherwise, fetch from the network.
      return fetch(event.request).then(networkResponse => {
        // Optional: Cache new requests on the fly
        // Be careful with this, especially with opaque responses from CDNs (no-cors)
        return networkResponse;
      });
    })
  );
});