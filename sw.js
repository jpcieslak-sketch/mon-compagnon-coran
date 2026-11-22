/* Service worker : cache hors-ligne + notifications */
const CACHE = "quran-hifz-v5";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./css/style.css?v=5", "./js/data.js?v=5", "./js/store.js?v=5", "./js/schedule.js?v=5", "./js/app.js?v=5",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "notify") {
    self.registration.showNotification(e.data.title, {
      body: e.data.body, icon: "./icons/icon-192.png", badge: "./icons/icon-192.png", tag: "quran-hifz"
    });
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then(list => {
    for (const c of list) if ("focus" in c) return c.focus();
    return clients.openWindow("./index.html");
  }));
});
