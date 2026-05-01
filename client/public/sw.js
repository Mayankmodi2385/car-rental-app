const CACHE_NAME = "drivekhata-v4";
const DATA_CACHE = "drivekhata-data-v4";
const API_ORIGIN = "https://car-rental-app-sdp6.onrender.com";

const STATIC_ASSETS = ["/", "/index.html", "/manifest.json", "/icon-192.png"];

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
        keys.filter((k) => k !== CACHE_NAME && k !== DATA_CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = event.request.url;

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
        return cached || fetchPromise;
      })
    );
    return;
  }

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

// ── PUSH RECEIVED (works even when app is CLOSED) ─────
self.addEventListener("push", (event) => {
  let data = {
    title: "DriveKhata Alert 🚨",
    body: "You have an overdue rental.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "overdue-alert",
    url: "/",
  };

  if (event.data) {
    try { data = { ...data, ...JSON.parse(event.data.text()) }; } catch {}
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: data.url },
      actions: [
        { action: "open", title: "View App" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});