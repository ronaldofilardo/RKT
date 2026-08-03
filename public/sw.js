// PWA desabilitado. Stub criado para sobrescrever o service worker antigo
// que a Vercel CDN ainda serve. Este arquivo será removido em um deploy
// futuro depois que o cache da CDN expirar.
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((c) => c.navigate(c.url)))
  );
});
