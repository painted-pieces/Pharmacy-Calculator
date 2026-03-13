const CACHE_NAME = 'ppag-calc-v2';

// App shell files — relative paths work from any serve location or local file
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './calculator.js',
  './export.js',
  './pdf-export.js',
  './manifest.json',
  './PPAG_CAL_LOGO1.png',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for app shell, network-first for CDN/external
self.addEventListener('fetch', (event) => {
  // Let cross-origin requests (SheetJS CDN etc.) go straight to network
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
