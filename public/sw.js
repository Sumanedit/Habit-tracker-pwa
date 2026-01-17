const CACHE_NAME = 'habit-cache-v2';
const ASSETS_CACHE = 'habit-assets-v2';
const API_CACHE = 'habit-api-v2';

const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

const ASSET_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching offline URLs');
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          // Keep only current cache versions
          if (![CACHE_NAME, ASSETS_CACHE, API_CACHE].includes(key)) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage({ type: 'CACHE_UPDATED' }));
  });
  return self.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const isAsset = ASSET_PATTERNS.some((pattern) => pattern.test(url.pathname));

  // Don't cache non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Local assets: cache-first
  if (isLocal && isAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) return response;
            const clone = response.clone();
            caches.open(ASSETS_CACHE).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => {
            // Return offline fallback for assets
            if (url.pathname.includes('.js')) {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
    );
    return;
  }

  // API/data requests: network-first, fallback to cache
  if (isLocal && !isAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Return cached API response if network fails
          return caches.match(event.request).then((cached) => {
            return cached || new Response('No cached data available', { status: 503 });
          });
        })
    );
    return;
  }

  // External requests: cache-first (e.g., CDN)
  if (!isLocal) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) return response;
            const clone = response.clone();
            caches.open(ASSETS_CACHE).then((cache) => cache.put(event.request, clone));
            return response;
          })
          .catch(() => caches.match(event.request));
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

