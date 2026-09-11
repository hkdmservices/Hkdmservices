const CACHE_NAME = 'hkdm-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/theme.js'
];

// Install the service worker and cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch assets from cache or network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // ============================================================
  // ✅ CRITICAL FIX: Skip everything that isn't a same-origin GET
  // for a static asset. Never intercept API calls, POSTs,
  // Firebase, Korapay, or cross-origin requests.
  // ============================================================

  // 1. Never handle non-GET requests (POST, PUT, DELETE, OPTIONS)
  if (request.method !== 'GET') {
    return; // Let browser handle normally
  }

  // 2. Never handle API calls
  if (url.pathname.startsWith('/api-php/') || url.pathname.startsWith('/api/')) {
    return;
  }

  // 3. Never handle Firebase, Google, Korapay, or CDN calls
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('korapay') ||
    url.hostname.includes('jsdelivr') ||
    url.hostname.includes('cloudflare')
  ) {
    return;
  }

  // 4. Only cache same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // 5. Don't cache HTML navigation requests aggressively — let them go to network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // 6. For static assets — try cache first, fall back to network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        // Cache successful GET responses for static assets only
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
