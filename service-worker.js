/*
 * IUBAT EEE Academic Dashboard — service worker
 * ---------------------------------------------
 * Caches the handful of static files the app is built from, so the GPA,
 * CGPA, planner and attendance calculators keep working offline once the
 * page has been visited at least once online. All paths below are relative
 * to this file's own location (the repo root), so this works unchanged
 * whether the site is served at a plain domain or as a GitHub Pages
 * project site (username.github.io/repo-name/).
 *
 * Bump CACHE_NAME whenever a cached file changes, so returning visitors
 * get the update instead of a stale cached copy.
 */

var CACHE_NAME = 'iubat-eee-dashboard-v1';

var CORE_ASSETS = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'data/courses.json',
  'assets/favicon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(CORE_ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* Network-first for the page itself, so a visitor online always gets the
   latest HTML; falls back to the cached copy when offline. Cache-first for
   everything else (CSS/JS/JSON/icons loaded from this origin), which is
   fast and fine since CACHE_NAME is bumped whenever they change. Requests
   to other origins (fonts, Chart.js CDN) are left to the network as-is —
   this service worker does not intercept or cache third-party requests. */
self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') { return; }

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) { return; }

  var isNavigation = request.mode === 'navigate' ||
    (request.headers.get('accept') || '').indexOf('text/html') !== -1;

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
          return response;
        })
        .catch(function () { return caches.match(request).then(function (r) { return r || caches.match('index.html'); }); })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) { return cached; }
      return fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
        return response;
      });
    })
  );
});
