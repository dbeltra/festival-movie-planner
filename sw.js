const CACHE_VERSION = '2.1.13';
const CACHE_NAME = `festival-planner-v${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/planner.js',
  '/data/schedule.json',
  '/manifest.json',
  '/icons/Assets.xcassets/AppIcon.appiconset/16.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/32.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/57.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/60.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/72.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/76.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/114.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/120.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/128.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/144.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/152.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/180.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/196.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/512.png',
  '/icons/Assets.xcassets/AppIcon.appiconset/1024.png',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - network first, cache fallback for better updates
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(event.request)
        .then((fetchResponse) => {
          // If we can fetch from network, update cache and return fresh content
          if (fetchResponse.status === 200) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        })
        .catch(() => {
          // If network fails, serve from cache
          return caches.match(event.request);
        });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
