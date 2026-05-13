import { describe, it, expect } from "vitest";
import { calculateShipping, getQuickEstimate } from "./auspostShipping";

/**
 * Australia Post Shipping Module Tests
 * Tests the actual calculateShipping() and getQuickEstimate() functions.
 * Without AUSPOST_API_KEY, these use zone-based fallback rates.
 */
describe("Australia Post Shipping Module", () => {
  it("should return metro rate for Sydney postcode", async () => {
    const result = await calculateShipping("2000");
    expect(result.selectedQuote).toBeDefined();
    expect(result.selectedQuote.source).toBe("fallback");
    expect(result.selectedQuote.price).toBe(10.0); // metro rate
    expect(result.selectedQuote.serviceName).toBe("Standard Parcel");
    expect(result.fromPostcode).toBe("2000");
    expect(result.toPostcode).toBe("2000");
  });

  it("should return regional rate for regional NSW postcode", async () => {
    const result = await calculateShipping("2500");
    expect(result.selectedQuote.source).toBe("fallback");
    expect(result.selectedQuote.price).toBe(14.0); // regional rate
  });

  it("should return interstate rate for Melbourne postcode", async () => {
    const result = await calculateShipping("3000");
    expect(result.selectedQuote.source).toBe("fallback");
    expect(result.selectedQuote.price).toBe(16.0); // interstate metro
  });

  it("should return interstate rate for Brisbane postcode", async () => {
    const result = await calculateShipping("4000");
    expect(result.selectedQuote.source).toBe("fallback");
    expect(result.selectedQuote.price).toBe(16.0); // interstate metro
  });

  it("should return remote rate for NT remote postcode", async () => {
    const result = await calculateShipping("0870");
    expect(result.selectedQuote.source).toBe("fallback");
    expect(result.selectedQuote.price).toBe(22.0); // remote rate
  });

  it("should return remote rate for WA remote postcode", async () => {
    const result = await calculateShipping("6750");
    expect(result.selectedQuote.source).toBe("fallback");
    expect(result.selectedQuote.price).toBe(22.0); // remote rate
  });

  it("should return quotes array with exactly one fallback quote", async () => {
    const result = await calculateShipping("2100");
    expect(result.quotes).toHaveLength(1);
    expect(result.quotes[0].serviceCode).toBe("FALLBACK_STANDARD");
  });

  it("should include estimated delivery days", async () => {
    const metroResult = await calculateShipping("2100");
    expect(metroResult.selectedQuote.estimatedDays).toBe("2-4");

    const remoteResult = await calculateShipping("0870");
    expect(remoteResult.selectedQuote.estimatedDays).toBe("5-10");

    const interstateResult = await calculateShipping("3000");
    expect(interstateResult.selectedQuote.estimatedDays).toBe("3-7");
  });

  // getQuickEstimate tests
  it("should return default rate when no postcode provided", () => {
    const estimate = getQuickEstimate();
    expect(estimate).toBe(14.0); // default fallback
  });

  it("should return metro estimate for Sydney postcode", () => {
    const estimate = getQuickEstimate("2100");
    expect(estimate).toBe(10.0);
  });

  it("should return interstate estimate for Melbourne postcode", () => {
    const estimate = getQuickEstimate("3000");
    expect(estimate).toBe(16.0);
  });

  it("should return remote estimate for remote postcode", () => {
    const estimate = getQuickEstimate("6750");
    expect(estimate).toBe(22.0);
  });
});
