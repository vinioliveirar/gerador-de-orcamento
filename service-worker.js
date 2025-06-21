const CACHE_NAME = "orcamento-pwa-v1";
const urlsToCache = ["/", "/index.html", "/script/script.js", "/styles/style.css", "/config.js", "/img/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});
