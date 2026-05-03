/* ============================================================
   Tablas para Juli — Service Worker
   Cache strategy: cache-first, network fallback
   ============================================================ */
'use strict';

const CACHE = 'tablas-juli-v1';
const BASE  = '/tablas-para-juli';

const PRECACHE_URLS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/styles.css`,
  `${BASE}/app.js`,
  `${BASE}/manifest.json`,
  `${BASE}/icons/icon-192.svg`,
  `${BASE}/icons/icon-512.svg`,
];

/* ── Install: pre-cache all critical assets ─────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: purge outdated caches ────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first, fallback to network ─────────────────── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response.ok) return response;
          /* Cache same-origin resources on the fly */
          if (new URL(event.request.url).origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          /* Offline fallback for navigation requests */
          if (event.request.mode === 'navigate') {
            return caches.match(`${BASE}/index.html`);
          }
        });
    })
  );
});
