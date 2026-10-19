import { describe, expect, it } from "vitest";
import { PACKAGE_IMAGE_SLOTS, PACKAGE_DEFAULT_IMAGES } from "../shared/packageImageSlots";
import { PACKAGE_HOME_TEMPLATE } from "../client/src/lib/packageHomeTemplate";
import { renderPackageMarkup, safeImageUrl, escapeMarkup } from "../client/src/lib/packageHome";
import { readFileSync } from "node:fs";

describe("integrated package homepage", () => {
  it("keeps the original six sections and actual ornamental logo without scripts", () => {
    expect(PACKAGE_HOME_TEMPLATE.match(/<section /g)).toHaveLength(6);
    expect(PACKAGE_HOME_TEMPLATE).toContain('id="rococo-corner"');
    expect(PACKAGE_HOME_TEMPLATE).toContain('id="rococo-crest"');
    expect(PACKAGE_HOME_TEMPLATE).not.toContain("<script");
    expect(PACKAGE_HOME_TEMPLATE).not.toMatch(/\son[a-z]+=/i);
    expect(PACKAGE_HOME_TEMPLATE).not.toContain("assets/");
  });
  it("renders managed assets and supports independent hero and ritual overrides", () => {
    const html = renderPackageMarkup(PACKAGE_HOME_TEMPLATE, { ...PACKAGE_DEFAULT_IMAGES, "boutique-hero": "https://example.com/new-hero.webp", "ritual-photo": "/manus-storage/new-ritual.png" });
    expect(html).toContain('src="https://example.com/new-hero.webp"');
    expect(html).toContain('src="/manus-storage/new-ritual.png"');
    expect(html).toContain('src="/manus-storage/queenstbb-antique-logo-transparent_88b672e4.png"');
    expect(html).not.toMatch(/\{\{[a-z-]+\}\}/);
  });
  it("provides ten unique admin image slots with production-safe default URLs", () => {
    expect(PACKAGE_IMAGE_SLOTS).toHaveLength(10);
    expect(new Set(PACKAGE_IMAGE_SLOTS.map(s => s.slotKey)).size).toBe(10);
    for (const slot of PACKAGE_IMAGE_SLOTS) { expect(slot.pageSlug).toBe("home"); expect(safeImageUrl(slot.fallback)).toBe(true); }
  });
  it("escapes runtime image values and rejects script/data/protocol-relative URLs", () => {
    for (const value of ["javascript:alert(1)", "data:image/svg+xml,<svg onload=alert(1)>", "//example.com/a", '/manus-storage/x" onerror="bad', '/manus-storage/\\evil']) expect(safeImageUrl(value)).toBe(false);
    expect(escapeMarkup('<img src="x">')).toBe("&lt;img src=&quot;x&quot;&gt;");
    expect(renderPackageMarkup('{{x}}', { x: 'https://example.com/img?a=1&b="test"' })).not.toContain('b="test"');
  });
  it("connects the current shop, cart, accounts and all three Melbourne stores", () => {
    for (const route of ['/objects?cart=1','/cake-booking','/gelato','/gift-cards','/my-page','/wholesale','/franchise','/customer-care']) expect(PACKAGE_HOME_TEMPLATE).toContain(route);
    expect(PACKAGE_HOME_TEMPLATE).toContain('408 Queen St, Melbourne VIC 3000');
    expect(PACKAGE_HOME_TEMPLATE).toContain('616 Glenferrie Rd, Hawthorn VIC 3122');
    expect(PACKAGE_HOME_TEMPLATE).toContain('Windsor');
    expect(PACKAGE_HOME_TEMPLATE).toContain('Closed Sunday');
    expect(PACKAGE_HOME_TEMPLATE).not.toContain('Online checkout is not available');
  });
  it("scopes the imported styles so POS and other pages are unaffected", () => {
    const css=readFileSync(new URL('../client/src/pages/packageHome.css', import.meta.url), 'utf8');
    expect(css).toContain('.bb-package .nav');
    expect(css).not.toMatch(/(?:^|\})\s*(?:body|:root|html)\s*\{/);
  });
  it("renders the wordmark and title without rectangular background panels", () => {
    const css = readFileSync(new URL('../client/src/pages/packageHomeIntegration.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.bb-package \.hero-title,\s*\.bb-package \.brand\s*\{ background: transparent; border: 0; box-shadow: none; \}/);
    const navigation = readFileSync(new URL('../client/src/components/Navigation.tsx', import.meta.url), 'utf8');
    expect(navigation).not.toContain('bg-[#401e19]');
    expect(navigation).not.toContain('shadow-[0_12px_35px');
  });
});
