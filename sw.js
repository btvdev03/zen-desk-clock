/**
 * ZenDesk Clock - Offline Service Worker
 */

const CACHE_NAME = 'zendesk-clock-v11';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/flip.css',
  './css/analog.css',
  './css/themes.css',
  './css/scenery.css',
  './js/app.js',
  './js/clock.js',
  './js/flip-renderer.js',
  './js/analog-renderer.js',
  './js/pomodoro.js',
  './js/audio-synth.js',
  './js/pip-controller.js',
  './js/wakelock.js',
  './js/quotes.js',
  './js/particle-engine.js',
  './js/event-countdown.js',
  './js/scenery-engine.js',
  './js/wallpaper-db.js',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback to cache index for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html', { ignoreSearch: true });
        }
      });
    })
  );
});
