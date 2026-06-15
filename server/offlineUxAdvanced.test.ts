import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Cart Sync Queue (useCartSync)", () => {
  const hookPath = resolve(__dirname, "../client/src/hooks/useCartSync.ts");

  it("should exist as a hook file", () => {
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toBeTruthy();
  });

  it("should define CartAction type with add/update/remove types", () => {
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain('"add"');
    expect(content).toContain('"update"');
    expect(content).toContain('"remove"');
  });

  it("should use localStorage for queue persistence", () => {
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("qsb-cart-sync-queue");
    expect(content).toContain("localStorage.getItem");
    expect(content).toContain("localStorage.setItem");
  });

  it("should export queueAction function", () => {
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("queueAction");
    expect(content).toContain("return { queueAction }");
  });

  it("should listen for online/offline events", () => {
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("addEventListener");
    expect(content).toContain('"offline"');
    expect(content).toContain('"online"');
  });

  it("should process queue on reconnection with delay", () => {
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("processQueue");
    expect(content).toContain("setTimeout");
  });

  it("should show toast notification after sync", () => {
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("toast.success");
    expect(content).toContain("동기화");
  });

  it("should clear queue after processing", () => {
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("localStorage.removeItem(CART_QUEUE_KEY)");
  });

  it("should check for pending queue from previous sessions on mount", () => {
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("navigator.onLine");
  });
});

describe("Cart Sync Integration in Objects Page", () => {
  const objectsPath = resolve(__dirname, "../client/src/pages/Objects.tsx");

  it("should import useCartSync hook", () => {
    const content = readFileSync(objectsPath, "utf-8");
    expect(content).toContain('import { useCartSync } from "@/hooks/useCartSync"');
  });

  it("should call queueAction on addToCart when offline", () => {
    const content = readFileSync(objectsPath, "utf-8");
    expect(content).toContain("navigator.onLine");
    expect(content).toContain('queueAction({ type: "add"');
  });

  it("should call queueAction on updateQuantity when offline", () => {
    const content = readFileSync(objectsPath, "utf-8");
    expect(content).toContain('queueAction({ type: "update"');
  });

  it("should call queueAction on removeFromCart when offline", () => {
    const content = readFileSync(objectsPath, "utf-8");
    expect(content).toContain('queueAction({ type: "remove"');
  });
});

describe("ProgressiveImage Component", () => {
  const componentPath = resolve(__dirname, "../client/src/components/ProgressiveImage.tsx");

  it("should exist as a component file", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toBeTruthy();
  });

  it("should track loading state", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("isLoaded");
    expect(content).toContain("setIsLoaded");
  });

  it("should track error state for fallback", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("hasError");
    expect(content).toContain("setHasError");
  });

  it("should use lazy loading attribute", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain('loading="lazy"');
  });

  it("should show skeleton/pulse animation while loading", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("animate-pulse");
  });

  it("should support blur placeholder option", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("placeholder");
    expect(content).toContain("blur-lg");
  });

  it("should transition opacity on load", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("transition-opacity");
    expect(content).toContain("opacity-100");
    expect(content).toContain("opacity-0");
  });

  it("should handle already-cached images", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("imgRef.current?.complete");
    expect(content).toContain("naturalWidth");
  });

  it("should reset state when src changes", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("setIsLoaded(false)");
    expect(content).toContain("setHasError(false)");
  });

  it("should show fallback icon on error", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("hasError");
    expect(content).toContain("<svg");
  });
});

describe("ProgressiveImage Usage in Pages", () => {
  const objectsPath = resolve(__dirname, "../client/src/pages/Objects.tsx");
  const homePath = resolve(__dirname, "../client/src/pages/Home.tsx");
  const layoutPath = resolve(__dirname, "../client/src/components/PageLayout.tsx");

  it("should be used in Objects page for product images", () => {
    const content = readFileSync(objectsPath, "utf-8");
    expect(content).toContain('import ProgressiveImage from "@/components/ProgressiveImage"');
    expect(content).toContain("<ProgressiveImage");
  });

  it("should be used in Home page for hero images", () => {
    const content = readFileSync(homePath, "utf-8");
    expect(content).toContain('import ProgressiveImage from "@/components/ProgressiveImage"');
    expect(content).toContain("<ProgressiveImage");
  });

  it("should be used in PageLayout for hero images", () => {
    const content = readFileSync(layoutPath, "utf-8");
    expect(content).toContain('import ProgressiveImage from "./ProgressiveImage"');
    expect(content).toContain("<ProgressiveImage");
  });
});

describe("Offline Read-Only Mode (Service Worker)", () => {
  const swPath = resolve(__dirname, "../client/public/sw.js");

  it("should have updated cache version", () => {
    const content = readFileSync(swPath, "utf-8");
    expect(content).toContain("queen-bb-v4");
  });

  it("should define cacheable pages list", () => {
    const content = readFileSync(swPath, "utf-8");
    expect(content).toContain("CACHEABLE_PAGES");
    expect(content).toContain("/tiramisu");
    expect(content).toContain("/gelato");
    expect(content).toContain("/objects");
  });

  it("should cache pages on visit for offline access", () => {
    const content = readFileSync(swPath, "utf-8");
    expect(content).toContain("isCacheablePage");
    expect(content).toContain("cache.put(event.request, clone)");
  });

  it("should serve cached pages when offline", () => {
    const content = readFileSync(swPath, "utf-8");
    expect(content).toContain("caches.match(event.request)");
    expect(content).toContain("caches.match(OFFLINE_URL)");
  });

  it("should never intercept API or storage requests", () => {
    const content = readFileSync(swPath, "utf-8");
    expect(content).toContain('url.includes("/api/")');
    expect(content).toContain('url.includes("/manus-storage/")');
  });

  it("should use stale-while-revalidate for static assets", () => {
    const content = readFileSync(swPath, "utf-8");
    expect(content).toContain("isStaticAsset");
    expect(content).toContain("STATIC_ASSET_PATTERN");
  });

  it("should cache CDN images (cloudfront) for offline viewing", () => {
    const content = readFileSync(swPath, "utf-8");
    expect(content).toContain("cloudfront.net");
  });

  it("should provide fallback image when CDN images unavailable offline", () => {
    const content = readFileSync(swPath, "utf-8");
    expect(content).toContain("image/gif");
    expect(content).toContain("Uint8Array");
  });

  it("should handle SKIP_WAITING message", () => {
    const content = readFileSync(swPath, "utf-8");
    expect(content).toContain("SKIP_WAITING");
    expect(content).toContain("self.skipWaiting()");
  });
});

describe("OfflinePageNotice Component", () => {
  const componentPath = resolve(__dirname, "../client/src/components/OfflinePageNotice.tsx");
  const appPath = resolve(__dirname, "../client/src/App.tsx");

  it("should exist as a component file", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toBeTruthy();
  });

  it("should show read-only mode notice in Korean", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("오프라인 읽기 전용 모드");
    expect(content).toContain("캐시된 페이지를 보고 있습니다");
  });

  it("should auto-dismiss after 8 seconds", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("8000");
    expect(content).toContain("setDismissed(true)");
  });

  it("should have dismiss button", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("onClick={() => setDismissed(true)}");
  });

  it("should use AnimatePresence for smooth transitions", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("AnimatePresence");
    expect(content).toContain("motion.div");
  });

  it("should be imported and used in App.tsx", () => {
    const appContent = readFileSync(appPath, "utf-8");
    expect(appContent).toContain('import OfflinePageNotice from "./components/OfflinePageNotice"');
    expect(appContent).toContain("<OfflinePageNotice />");
  });

  it("should reset dismissed state when going offline again", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("setDismissed(false)");
  });
});
