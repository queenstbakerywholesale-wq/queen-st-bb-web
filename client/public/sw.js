const CACHE_NAME = "queen-bb-v4";
const OFFLINE_URL = "/";

// Pages to pre-cache for offline access
const PRECACHE_PAGES = [OFFLINE_URL];

// Pages that should be cached when visited (menu/content pages)
const CACHEABLE_PAGES = [
  "/tiramisu",
  "/gelato",
  "/space",
  "/objects",
  "/wholesale",
  "/cake-booking",
  "/gift-cards",
  "/about",
  "/customer-care",
];

// Static asset patterns to cache (JS, CSS bundles)
const STATIC_ASSET_PATTERN = /\.(js|css|woff2?|ttf)(\?.*)?$/;

// Pre-cache essential pages on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_PAGES);
    })
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Determine if a URL is a cacheable page
function isCacheablePage(url) {
  const pathname = new URL(url).pathname;
  return CACHEABLE_PAGES.includes(pathname) || pathname === "/";
}

// Determine if a URL is a static asset worth caching
function isStaticAsset(url) {
  return STATIC_ASSET_PATTERN.test(url);
}

self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  // NEVER intercept API calls, tRPC, or storage proxy requests
  if (url.includes("/api/") || url.includes("/manus-storage/")) return;

  // Strategy for navigation requests (page loads)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful HTML responses for cacheable pages
          if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
            if (isCacheablePage(url)) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
          }
          return response;
        })
        .catch(() => {
          // Offline: try to serve cached version, fallback to home page
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Strategy for static assets (JS, CSS, fonts): stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Strategy for CDN images (cloudfront): cache-first for offline viewing
  if (url.includes("cloudfront.net")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // Return a transparent 1x1 pixel as fallback for images
            return new Response(
              new Uint8Array([
                0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
                0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
                0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
                0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
                0x01, 0x00, 0x3b,
              ]),
              { headers: { "Content-Type": "image/gif" } }
            );
          });
      })
    );
    return;
  }

  // All other requests: network only (no caching)
});

// Listen for messages from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
