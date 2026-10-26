// Minimal service worker: caches the app shell so TagayOke installs and opens fast.
// It never touches cross-origin requests (Supabase, YouTube, Google Fonts), so queue data is always live.
// Bump CACHE when you want every device to drop its old cached files.
const CACHE = 'tagayoke-v1';
const SHELL = ['./', './manifest.webmanifest', './icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Pages: network first so a new deploy shows up, cached shell when offline.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); return res; })
        .catch(() => caches.match('./')),
    );
    return;
  }

  // Built assets: serve cached copy instantly, refresh it in the background.
  e.respondWith(
    caches.match(request).then((hit) => {
      const net = fetch(request)
        .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); } return res; })
        .catch(() => hit);
      return hit || net;
    }),
  );
});
