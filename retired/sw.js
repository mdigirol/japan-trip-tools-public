// Kill switch for the retired public demo. Deployed in place of the app's service worker at the
// same URL, so every installed copy picks it up the next time it opens online (or checks for updates).
// It takes over at once, deletes this app's caches, unregisters itself and reloads open windows,
// which then load the "retired" page from the network.
//
// Cache Storage is shared by every app on https://mdigirol.github.io, including the private
// japan-trip-tools app. Only delete caches that belong to this app: the jtc-public- runtime caches and
// Workbox's precache for this scope. Never call caches.delete on everything.
// IndexedDB and localStorage are left alone, so re-publishing the app brings saved data back.

const PREFIX = 'jtc-public-';

function ownsCache(name, scope) {
  return name.startsWith(PREFIX) || name.includes(scope);
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const scope = self.registration.scope;
  event.waitUntil(
    self.caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => ownsCache(n, scope)).map((n) => self.caches.delete(n))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
  );
});
