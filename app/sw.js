// Offline-Cache für die App-Dateien. Netz zuerst, damit Updates sofort ankommen.
const CACHE = 'baulot-v2';
const SHELL = [
  './', 'index.html', 'app.css', 'manifest.webmanifest', 'icon-192.png',
  'vendor/jspdf.umd.min.js', 'vendor/fonts/Figtree-Regular.ttf', 'vendor/fonts/Figtree-SemiBold.ttf', 'vendor/fonts/Outfit-SemiBold.ttf', 'js/app.js', 'js/pdf.js', 'js/store.js', 'js/ui.js', 'js/icons.js', 'js/paper.js', 'js/contracts.js',
  '../assets/img/logo-dark.png',
  '../assets/fonts/outfit-latin-wght-normal.woff2', '../assets/fonts/figtree-latin-wght-normal.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && (new URL(e.request.url).origin === location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
