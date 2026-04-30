const CACHE_NAME = "drivekhata-v3";
const DATA_CACHE = "drivekhata-data-v3";
const API_ORIGIN = "https://car-rental-app-sdp6.onrender.com";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
];

// ── INSTALL ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  // ── API requests: stale-while-revalidate ──
  // Return cached data INSTANTLY, update cache in background silently
  if (url.includes(API_ORIGIN)) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);

        const fetchPromise = fetch(event.request)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(event.request, networkRes.clone());
            }
            return networkRes;
          })
          .catch(() => null);

        // If we have cached data, return it immediately
        // Fresh fetch happens in background and updates cache for NEXT open
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ── Static assets: cache first, fallback to network ──
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
            }
            return res;
          })
          .catch(() => caches.match("/index.html"))
    )
  );
});