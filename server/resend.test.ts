import { describe, it, expect } from "vitest";

/**
 * Resend API Key Validation Test
 * Verifies that the RESEND_API_KEY environment variable is configured
 * and can successfully authenticate with the Resend API.
 */
describe("Resend API Configuration", () => {
  it("should have RESEND_API_KEY configured", () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
    expect(apiKey!.startsWith("re_")).toBe(true);
  });

  it("should have SENDER_EMAIL configured", () => {
    const senderEmail = process.env.SENDER_EMAIL;
    expect(senderEmail).toBeDefined();
    expect(senderEmail).not.toBe("");
    expect(senderEmail).toContain("@");
  });

  it("should successfully authenticate with Resend API", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !apiKey.startsWith("re_")) {
      console.warn("Skipping API test: RESEND_API_KEY not configured");
      return;
    }

    // Call the Resend API to list domains (lightweight endpoint)
    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // 200 = success, 401 = invalid key
    expect(response.status).not.toBe(401);
    expect(response.status).toBe(200);
  }, 15000);

  it("should successfully send a test email via Resend API", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !apiKey.startsWith("re_")) {
      console.warn("Skipping send test: RESEND_API_KEY not configured");
      return;
    }

    // Send a test email using Resend's delivered@resend.dev test address
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Queen St BB <onboarding@resend.dev>",
        to: "delivered@resend.dev",
        subject: "Test Email - Queen St BB",
        html: "<p>This is a test email from Queen St BB order system.</p>",
      }),
    });

    const data = await response.json();
    // Resend returns 200 with an id on success
    expect(response.status).toBe(200);
    expect(data.id).toBeDefined();
  }, 15000);
});
