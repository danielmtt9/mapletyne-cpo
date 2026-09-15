const CACHE = 'otaski-charge-v5';
const PRECACHE = [
  '/app/',
  '/app/static/style.css?v=4',
  '/skin/style.css?v=4',
  '/app/static/home.js?v=6',
  '/app/static/leaflet.js?v=2',
  '/app/static/leaflet.css?v=2',
  '/app/static/htmx.min.js?v=2',
  '/app/static/icon-192.png?v=4',
  '/app/static/icon-512.png?v=4',
  '/app/manifest.json?v=4',
  '/skin/logo.svg?v=4',
  '/skin/favicon.svg?v=4'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return c.addAll(PRECACHE).catch(err => console.warn('Precache partial warning:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls & telemetry polling: network only (never serve stale meter data)
  if (url.pathname.includes('/api/')) return;

  // Static assets: cache first with network fallback
  if (url.pathname.includes('/static/') || url.pathname.includes('/skin/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // HTML navigation: network first, cache fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('/app/')))
    );
    return;
  }
});

// ── Push notifications ────────────────────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(
    data.title || '⚡ Charging Update',
    {
      body: data.body || 'Charging session update available',
      icon: '/app/static/icon-192.png',
      badge: '/app/static/icon-192.png',
      vibrate: [200, 100, 200],
      data: data,
    }
  ));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data && e.notification.data.url ? e.notification.data.url : '/app/';
  e.waitUntil(clients.openWindow(url));
});
