const SHELL_CACHE = 'quire-shell-v1';
const SHELL_URLS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only intercept same-origin navigation requests
  if (request.mode !== 'navigate') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match('/'))
  );
});
