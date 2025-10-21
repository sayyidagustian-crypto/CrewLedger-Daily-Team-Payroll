
const CACHE_NAME = 'gaji-borongan-v13'; // Versi dinaikkan untuk pembaruan paksa dan perbaikan cache.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon.svg',
  '/manifest.json',
  // Dependensi penting dari CDN agar tersedia offline
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf-autotable.umd.min.js',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client'
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
          const request = new Request(url, { cache: 'reload' });
          const response = await fetch(request);
          
          if (!response.ok) {
            // Jika ada satu respons saja yang gagal, seluruh instalasi akan gagal.
            throw new Error(`Gagal mengambil ${url}: status ${response.status}`);
          }
          
          await cache.put(request, response.clone());
           console.log(`Service Worker: Berhasil cache -> ${url}`);
        }
        
        console.log('Service Worker: App Shell berhasil di-cache. Mengaktifkan...');
        // Paksa service worker baru untuk aktif segera setelah instalasi selesai.
        await self.skipWaiting();
      } catch (error) {
        console.error('Service Worker: Instalasi gagal karena gagal caching.', error);
        // Lempar kembali error agar browser tahu instalasi gagal dan akan mencoba lagi.
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

  // --- Strategi untuk Navigasi Halaman (SPA Routing) ---
  // Coba jaringan dulu, jika gagal (offline), sajikan index.html dari cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('Navigasi gagal, menyajikan App Shell dari cache.');
        return caches.match('/index.html');
      })
    );
    return;
  }

  // --- Strategi untuk Aset yang Sudah di-Cache (App Shell) ---
  // Cek apakah URL ada dalam daftar App Shell kita.
  // URL dapat memiliki parameter, jadi kita perlu membersihkannya.
  const requestUrl = new URL(event.request.url);
  const resourceUrl = requestUrl.origin + requestUrl.pathname;
  
  if (APP_SHELL_URLS.includes(resourceUrl)) {
    // Gunakan strategi "Cache First" untuk kecepatan maksimal.
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
    return;
  }

  // --- Untuk semua permintaan lainnya (misalnya, API, gambar eksternal) ---
  // Langsung ke jaringan. Jangan cache respons ini untuk menghindari masalah.
  event.respondWith(fetch(event.request));
});
