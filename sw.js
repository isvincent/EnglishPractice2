/* English Bloom 2.0.1：每個GitHub Pages路徑分開管理快取。 */
const SCOPE = new URL(self.registration.scope);
const PREFIX = 'english-bloom:' + encodeURIComponent(SCOPE.pathname) + ':';
const CACHE = PREFIX + 'v2-20281231-r1';
const SHELL = ['./','./index.html','./styles.css','./app.js','./config.js',
  './demo.json','./manifest.webmanifest','./assets/garden.svg',
  './assets/icon-192.png','./assets/icon-512.png'];
function owns(url) {
  const u = new URL(url);
  return u.origin === SCOPE.origin && u.pathname.startsWith(SCOPE.pathname);
}
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(SHELL.map(p => new URL(p,SCOPE).href))));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name === CACHE || !/^english-bloom(?:-|:)/.test(name)) continue;
      const cache = await caches.open(name);
      // 舊版可能共用快取名稱，只刪目前網站路徑內的項目。
      for (const request of await cache.keys()) {
        if (owns(request.url)) await cache.delete(request);
      }
      if ((await cache.keys()).length === 0) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !owns(event.request.url)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(new Request(event.request,{cache:'no-cache'}));
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE)
          .then(cache => cache.put(event.request,copy)));
      }
      return response;
    } catch {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(event.request);
      if (hit) return hit;
      if (event.request.mode === 'navigate') {
        const index = await cache.match(new URL('index.html',SCOPE).href);
        if (index) return index;
      }
      return Response.error();
    }
  })());
});
