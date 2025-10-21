
const CACHE_NAME = 'gaji-borongan-v15'; // Version increased for offline library caching
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon.svg',
  '/manifest.json',
  // Local libraries for offline functionality
  '/libs/jspdf.umd.min.js',
  '/libs/jspdf-autotable.umd.min.js',
  '/libs/docx.min.js',
  // Essential CDN dependencies that are not part of the core offline feature
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Event install: cache semua aset App Shell dengan strategi sekuensial yang lebih andal.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('Service Worker: Memulai proses caching App Shell secara sekuensial.');
        
        // Menggunakan loop for...of untuk caching sekuensial, bukan Promise.all (paralel).
        // Ini lebih lambat tetapi lebih tangguh terhadap masalah jaringan.
        for (const url of APP_SHELL_URLS) {
          try {
            const request = new Request(url, { cache: 'reload' }); // Force network request
            const response = await fetch(request);
            
            if (!response.ok) {
              throw new Error(`Gagal mengambil ${url}: status ${response.status}`);
            }
            
            await cache.put(request, response.clone());
            console.log(`Service Worker: Berhasil cache -> ${url}`);
          } catch (error) {
            console.warn(`Service Worker: Gagal cache -> ${url}. Melanjutkan...`, error);
            // Don't fail the entire installation for non-critical assets like fonts
            if (!url.includes('/libs/')) { 
                continue;
            }
            throw error; // Fail install if core offline libs fail
          }
        }
        
        console.log('Service Worker: App Shell berhasil di-cache. Mengaktifkan...');
        await self.skipWaiting();
      } catch (error) {
        console.error('Service Worker: Instalasi gagal karena gagal caching.', error);
        throw error;
      }
    })()
  );
});


// Event activate: bersihkan cache lama yang tidak terpakai.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Ambil alih kontrol halaman yang terbuka.
  );
});

// Event fetch: Terapkan strategi caching yang cerdas berdasarkan jenis permintaan.
self.addEventListener('fetch', (event) => {
  // Hanya proses permintaan GET.
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);

  // --- Strategi untuk Navigasi Halaman (SPA Routing) ---
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          console.log('Navigasi gagal, menyajikan App Shell dari cache.');
          const cache = await caches.open(CACHE_NAME);
          return await cache.match('/index.html');
        }
      })()
    );
    return;
  }

  // --- Strategi untuk Aset yang Sudah di-Cache (App Shell & libs) ---
  // Gunakan strategi "Cache First, then Network"
  if (APP_SHELL_URLS.some(path => url.pathname === path || (url.origin + url.pathname) === path) || url.pathname.startsWith('/libs/')) {
    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Jika tidak ada di cache, coba ambil dari jaringan
        try {
            const networkResponse = await fetch(event.request);
            // Simpan respons jaringan ke cache untuk permintaan mendatang
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
        } catch (error) {
            console.error('Fetch failed from network for:', event.request.url, error);
            // Di sini Anda bisa mengembalikan respons fallback jika diperlukan
        }
      })()
    );
    return;
  }

  // --- Untuk semua permintaan lainnya ---
  // Coba jaringan dulu, jika gagal, baru cache (Network falling back to cache)
  event.respondWith(
    fetch(event.request).catch(() => {
        return caches.match(event.request);
    })
  );
});