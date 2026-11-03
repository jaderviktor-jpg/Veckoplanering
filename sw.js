/* Offline-stöd för Veckoplanering.
   Ändra VERSION när appen uppdateras så hämtas nya filer. */
const VERSION = 'v2';
const APP_CACHE = 'veckoplan-app-' + VERSION;
const FONT_CACHE = 'veckoplan-fonts';
const APP_FILES = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith('veckoplan-app-') && k !== APP_CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Typsnitt och Supabase-biblioteket: spara första gången, använd sparad kopia sedan
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.open(FONT_CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // Sidan själv: nätet först (så uppdateringar syns), sparad kopia om offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      caches.open(APP_CACHE).then(c => c.put('./index.html', res.clone()));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // Övriga filer: sparad kopia först
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) caches.open(APP_CACHE).then(c => c.put(req, res.clone()));
    return res;
  })));
});
