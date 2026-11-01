// Imported by the generated service worker (vite.config.ts > workbox.importScripts).
// Tapping a reminder focuses an open TechLingo window, or opens one on the right page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = all.find((c) => new URL(c.url).origin === self.location.origin);
    if (client) { await client.focus(); if ('navigate' in client) await client.navigate(url); return; }
    await self.clients.openWindow(url);
  })());
});
