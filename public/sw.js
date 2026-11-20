const registrationPath = new URL(self.registration.scope).pathname;
const scopeRoot = registrationPath.endsWith('/') ? registrationPath : registrationPath + '/';
const scopeKey = scopeRoot === '/' ? 'root' : scopeRoot.slice(1, -1).replace(/\\//g, '-');
const cachePrefix = 'salesx-ai-pwa:' + scopeKey + ':';
const CACHE_NAME = cachePrefix + 'v2';
const APP_SHELL = [
  scopeRoot + 'manifest.webmanifest',
  scopeRoot + 'icon.svg',
  scopeRoot + 'apple-touch-icon.png',
  scopeRoot + 'pwa-192x192.png',
  scopeRoot + 'pwa-512x512.png',
  scopeRoot + 'pwa-maskable-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map((asset) => cache.add(asset)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key === 'salesx-ai-pwa-v1' || (key.startsWith(cachePrefix) && key !== CACHE_NAME))
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/') || url.pathname.includes('/auth/')) return;

  const isNextStatic = url.pathname.startsWith(scopeRoot + '_next/static/');
  const isPublicStatic = url.pathname.startsWith(scopeRoot) &&
    /\\.(?:css|js|svg|png|jpe?g|webp|ico|woff2?)$/i.test(url.pathname);
  const isManifest = url.pathname === scopeRoot + 'manifest.webmanifest';
  if (!isNextStatic && !isPublicStatic && !isManifest) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || Response.error()))
  );
});
