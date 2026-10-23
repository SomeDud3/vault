// Offline: same-origin files network-first (always fresh when online, cached copy when offline),
// CDN libraries cache-first. GitHub API calls are never cached.
const CACHE = 'vault-v1';  // bump to force refresh of cached CDN libs
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname === 'api.github.com') return;
  if (url.origin === location.origin) {
    const key = url.origin + url.pathname;  // ignore cache-busting query strings
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(cache => cache.put(key, c)); }
      return r;
    }).catch(() => caches.match(key).then(r => r || caches.match(new URL('./', location).href))));
  } else if (/cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      const c = r.clone(); caches.open(CACHE).then(cache => cache.put(req, c)); return r;
    })));
  }
});
self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {title: 'Vault'};
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body, tag: d.tag, icon: 'icon.png', badge: 'icon.png', data: {url: d.url || './'}, requireInteraction: true
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
