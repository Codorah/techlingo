// TechLingo — service worker : l'app complète fonctionne hors ligne
const CACHE = 'techlingo-v4';
const SHELL = [
  './', './index.html', './style.css', './fonts.css', './data.js', './data-extra.js', './icons.js', './app.js',
  './privacy.html', './terms.html', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-192.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png',
  './fonts/DMSans-400-latin-ext.woff2',
  './fonts/DMSans-400-latin.woff2',
  './fonts/DMSans-500-latin-ext.woff2',
  './fonts/DMSans-500-latin.woff2',
  './fonts/DMSans-700-latin-ext.woff2',
  './fonts/DMSans-700-latin.woff2',
  './fonts/JetBrainsMono-500-latin-ext.woff2',
  './fonts/JetBrainsMono-500-latin.woff2',
  './fonts/Nunito-800-latin-ext.woff2',
  './fonts/Nunito-800-latin.woff2',
  './fonts/Nunito-900-latin-ext.woff2',
  './fonts/Nunito-900-latin.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Aucune ressource externe : on ignore toute requête hors origine
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('.apk')) return;

  // Fichiers locaux : réseau d'abord pour avoir la dernière version, cache en secours
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => {
    if (list.length) return list[0].focus();
    return self.clients.openWindow('./');
  }));
});
