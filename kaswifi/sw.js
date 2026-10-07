/* Bendot Net • service worker: simpan halaman pembuka & ikon supaya aplikasi tetap terbuka saat sinyal lemah.
   Data tetap diambil langsung dari Google Sheet (tidak disimpan di HP). */
const VERSI = "kaswifi-v1";
const FILE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSI).then(c => c.addAll(FILE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSI).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;   // halaman Google tidak disentuh
  e.respondWith(fetch(e.request).then(r => { const salin = r.clone(); caches.open(VERSI).then(c => c.put(e.request, salin)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
