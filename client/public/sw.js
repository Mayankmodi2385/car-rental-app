const CACHE_NAME = "drivekhata-v1";

// Files to cache for offline use
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.png",
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing DriveKhata Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET and cross-origin API requests
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("onrender.com")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache fresh responses for static assets
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/index.html");
        });
      })
  );
});