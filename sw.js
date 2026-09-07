// ============================================================
// Service Worker — кеширование для офлайн-работы PWA
// ============================================================

const CACHE_NAME = "guess-capital-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./css/animations.css",
  "./js/app.js",
  "./js/db.js",
  "./js/auth.js",
  "./js/game.js",
  "./js/answer-checker.js",
  "./js/settings.js",
  "./js/leaderboard.js",
  "./data/countries.js",
  "./assets/logo.svg",
  "./js/map-renderer.js",
  "./js/capitals.js",
  "./assets/world.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      )
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Картинки кешируем на лету (stale-while-revalidate)
  if (
    event.request.url.includes("/flags/") ||
    event.request.url.includes("/borders/") ||
    event.request.url.includes("/capitals/") ||
    event.request.url.includes("upload.wikimedia.org")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok || response.type === "opaque") { // <-- изменено
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, clone)
            );
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      }),
    );
    return;
  }

  // Остальное — cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, clone)
          );
        }
        return response;
      });
    }),
  );
});
