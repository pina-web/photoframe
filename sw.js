/* sw.js — 너와 함께 하는 포토프레임 service worker */
const CACHE = 'photoframe-v1';
const APP_SHELL = [
  './',
  './photoframe.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(APP_SHELL).catch(() => {/* tolerate missing files */}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache-first, falling back to network; cache new fetches as they succeed. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req)
        .then(resp => {
          // cache successful & opaque (cross-origin) responses
          if (resp && (resp.ok || resp.type === 'opaque')) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(req, clone).catch(()=>{}));
          }
          return resp;
        })
        .catch(() => {
          // offline fallback: return cached HTML
          if (req.mode === 'navigate' || req.destination === 'document') {
            return caches.match('./photoframe.html');
          }
        });
    })
  );
});
