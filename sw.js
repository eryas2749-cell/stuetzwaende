/* Offline-Cache für die App-Hülle. Daten liegen in IndexedDB, nicht im Cache. */
const CACHE = "besichtigung-v3";
const CDN = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
const FILES = ["./", "./index.html", "./vorlage.xlsm", "./jszip.min.js", "./jspdf.min.js", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES).then(() => c.add(CDN).catch(() => {}))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url === CDN) { e.respondWith(caches.match(CDN).then((r) => r || fetch(e.request))); return; }
  if (new URL(e.request.url).origin !== location.origin) return;
  // Netz zuerst (damit Updates ankommen), sonst Cache
  e.respondWith(fetch(e.request).then((r) => {
    const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html"))));
});
