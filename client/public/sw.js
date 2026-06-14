const CACHE_NAME = "queen-bb-v3";
const OFFLINE_URL = "/";

// Pre-cache the offline fallback page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([OFFLINE_URL]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy with offline fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // NEVER intercept API calls, tRPC, or storage requests
  const url = event.request.url;
  if (url.includes("/api/") || url.includes("/manus-storage/")) return;

  // Only handle navigation requests (page loads)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful HTML responses
          if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match(OFFLINE_URL)))
    );
  }
  // Let all other requests (JS, CSS, images) go through the network normally
  // without service worker intervention to avoid stale cache issues
});
