/* مسارك الهندسى — Service Worker
   Strategy:
   - Precache the app shell (works offline after first visit)
   - Navigations: network-first so updates arrive, cache fallback when offline
   - Same-origin assets: cache-first
   - CDN (scripts/fonts): stale-while-revalidate
*/
const CACHE = 'msarak-v1';
const PRECACHE = [
  './',
  './index.html',
  './tailwind.css',
  './manifest.webmanifest',
  './logo.webp',
  './uob-logo.webp',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './transcript-guide.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {
      // Network-first for the page itself (fresh content), offline falls back to cache
      event.respondWith(
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
      );
      return;
    }
    // Cache-first for local assets
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }))
    );
    return;
  }

  // Cross-origin (CDN scripts & fonts): stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
