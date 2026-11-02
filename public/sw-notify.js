// Imported by the generated service worker (vite.config.ts > workbox.importScripts).

var DEFAULT_TITLE = 'C’est l’heure de ton anglais pro';
var DEFAULT_BODY = 'Tes 5 minutes d’anglais pro t’attendent.';

/** Only same-origin paths are opened from a notification. */
function safeUrl(raw) {
  try {
    var u = new URL(typeof raw === 'string' && raw ? raw : '/', self.location.origin);
    return u.origin === self.location.origin ? u.pathname + u.search + u.hash : '/';
  } catch (e) {
    return '/';
  }
}

// Daily reminder sent by /api/push/send while the app is closed. Every push must show a
// notification (userVisibleOnly), so a missing or broken payload falls back to the default copy.
self.addEventListener('push', (event) => {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  var title = typeof data.title === 'string' && data.title ? data.title : DEFAULT_TITLE;
  var body = typeof data.body === 'string' && data.body ? data.body : DEFAULT_BODY;
  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'techlingo-daily',
    data: { url: safeUrl(data.url) }
  }));
});

// Tapping a reminder focuses an open TechLingo window on the right page, or opens a new one.
// navigate() only works on windows this worker controls, hence the fallbacks.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  var url = safeUrl(event.notification.data && event.notification.data.url);
  event.waitUntil((async () => {
    var all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    var same = all.filter((c) => new URL(c.url).origin === self.location.origin);
    var client = same.find((c) => c.focused) || same[0];
    if (client) {
      try {
        var target = new URL(url, self.location.origin).href;
        var shown = client.url === target ? client : 'navigate' in client ? await client.navigate(target) : null;
        if (shown) { await shown.focus(); return; }
      } catch (e) { /* uncontrolled window: open a fresh one below */ }
    }
    await self.clients.openWindow(url);
  })());
});
