import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("OfflineBanner Component", () => {
  const componentPath = resolve(__dirname, "../client/src/components/OfflineBanner.tsx");
  const appPath = resolve(__dirname, "../client/src/App.tsx");

  it("should exist as a component file", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toBeTruthy();
  });

  it("should use navigator.onLine for initial state", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("navigator.onLine");
  });

  it("should listen for online and offline events", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("addEventListener");
    expect(content).toContain('"offline"');
    expect(content).toContain('"online"');
  });

  it("should clean up event listeners on unmount", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("removeEventListener");
  });

  it("should use AnimatePresence for smooth transitions", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("AnimatePresence");
    expect(content).toContain("motion.div");
  });

  it("should display offline message in Korean", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("인터넷 연결이 끊겼습니다");
  });

  it("should use fixed positioning with highest z-index", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("fixed");
    expect(content).toContain("top-0");
    expect(content).toMatch(/z-\[\d+\]/);
  });

  it("should include WifiOff icon", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("WifiOff");
  });

  it("should be imported and used in App.tsx", () => {
    const appContent = readFileSync(appPath, "utf-8");
    expect(appContent).toContain('import OfflineBanner from "./components/OfflineBanner"');
    expect(appContent).toContain("<OfflineBanner />");
  });

  // New tests for retry button
  it("should include a retry button with RefreshCw icon", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("RefreshCw");
    expect(content).toContain("handleRetry");
    expect(content).toContain("다시 시도");
  });

  it("should show spinning animation when retrying", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("animate-spin");
    expect(content).toContain("isRetrying");
  });

  it("should disable retry button while retrying", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("disabled={isRetrying}");
  });

  // New tests for reconnection toast
  it("should show toast when connection is restored", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("다시 연결되었습니다");
    expect(content).toContain("toast.success");
  });

  it("should track previous offline state with ref", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("wasOfflineRef");
    expect(content).toContain("useRef");
  });

  it("should show error toast when retry fails", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("아직 연결되지 않았습니다");
    expect(content).toContain("toast.error");
  });

  it("should use AbortController with timeout for retry fetch", () => {
    const content = readFileSync(componentPath, "utf-8");
    expect(content).toContain("AbortController");
    expect(content).toContain("abort");
  });
});

describe("Cart localStorage Persistence", () => {
  const objectsPath = resolve(__dirname, "../client/src/pages/Objects.tsx");

  it("should initialize cart from localStorage", () => {
    const content = readFileSync(objectsPath, "utf-8");
    expect(content).toContain('localStorage.getItem("qsb-cart")');
    expect(content).toContain("JSON.parse(saved)");
  });

  it("should save cart to localStorage on changes", () => {
    const content = readFileSync(objectsPath, "utf-8");
    expect(content).toContain('localStorage.setItem("qsb-cart"');
    expect(content).toContain("JSON.stringify(cart)");
  });

  it("should clear localStorage cart after successful checkout", () => {
    const content = readFileSync(objectsPath, "utf-8");
    expect(content).toContain('localStorage.removeItem("qsb-cart")');
  });

  it("should handle localStorage errors gracefully", () => {
    const content = readFileSync(objectsPath, "utf-8");
    // Should have try-catch for both read and write
    const tryCatchCount = (content.match(/try\s*\{/g) || []).length;
    expect(tryCatchCount).toBeGreaterThanOrEqual(2);
  });
});
