/* Kalensari Store - service worker
   Strategi: network-first untuk file situs sendiri (agar update selalu terbaru),
   cache hanya sebagai cadangan saat offline. Permintaan ke server lain
   (database/cloud, Google Maps, Google Sheets, WhatsApp) TIDAK disentuh sama sekali. */
const VERSION = "ks-v4";
const CACHE = "kalensari-" + VERSION;
const PRECACHE = [
  "./offline.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("kalensari-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // biarkan cloud/Maps/Sheets/WA lewat langsung
  if (req.headers.has("range")) return;                 // musik/video (potongan data) biarkan langsung
  if (/\.(mp3|mp4|m4a|ogg|wav|webm)$/i.test(url.pathname)) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => {
          if (hit) return hit;
          if (req.mode === "navigate") return caches.match("./offline.html");
          return Response.error();
        })
      )
  );
});

/* ===== Notifikasi push (pesanan masuk untuk kurir) ===== */
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : "" }; }
  const title = d.title || "Kalensari Store";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "Ada pesanan baru untuk Anda.",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: d.tag || "pesanan-baru",
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 120, 300, 120, 300],
    data: { url: d.url || "dashboard-kurir.html" }
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || "dashboard-kurir.html", self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.indexOf("dashboard-kurir.html") !== -1 && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
