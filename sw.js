var CACHE_NAME = 'familjeappar-v1';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-32.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(APP_SHELL); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Network-first for the hub's own shell so a fresh deploy is picked up
   whenever online; falls back to the cache when offline. This service
   worker's scope is just this folder - it never touches /Ledger/ or
   /Shoppinglist/, which are separate apps with their own service workers. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (cached) { return cached || caches.match('./index.html'); });
    })
  );
});
