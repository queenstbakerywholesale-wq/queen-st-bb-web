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
});
