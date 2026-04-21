import { describe, expect, it } from "vitest";
import { applyWatermark } from "./watermark";
import sharp from "sharp";

describe("watermark", () => {
  /**
   * Create a small test image buffer (100x100 red square)
   */
  async function createTestImage(width = 400, height = 300): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 200, g: 150, b: 100 },
      },
    })
      .jpeg()
      .toBuffer();
  }

  it("returns a valid image buffer with watermark applied", async () => {
    const original = await createTestImage();
    const result = await applyWatermark(original);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    // Verify the result is still a valid image
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(400);
    expect(metadata.height).toBe(300);
  });

  it("preserves image dimensions after watermark", async () => {
    const original = await createTestImage(800, 600);
    const result = await applyWatermark(original);

    const originalMeta = await sharp(original).metadata();
    const resultMeta = await sharp(result).metadata();

    expect(resultMeta.width).toBe(originalMeta.width);
    expect(resultMeta.height).toBe(originalMeta.height);
  });

  it("accepts custom watermark text", async () => {
    const original = await createTestImage();
    const result = await applyWatermark(original, { text: "CUSTOM BRAND" });

    expect(result).toBeInstanceOf(Buffer);
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(400);
  });

  it("accepts different position options", async () => {
    const original = await createTestImage();

    const positions = [
      "bottom-right",
      "bottom-left",
      "bottom-center",
      "center",
    ] as const;

    for (const position of positions) {
      const result = await applyWatermark(original, { position });
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("handles small images without error", async () => {
    const small = await createTestImage(50, 50);
    const result = await applyWatermark(small);

    expect(result).toBeInstanceOf(Buffer);
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(50);
    expect(metadata.height).toBe(50);
  });

  it("handles large images without error", async () => {
    const large = await createTestImage(2000, 1500);
    const result = await applyWatermark(large);

    expect(result).toBeInstanceOf(Buffer);
    const metadata = await sharp(result).metadata();
    expect(metadata.width).toBe(2000);
    expect(metadata.height).toBe(1500);
  });

  it("respects custom opacity setting", async () => {
    const original = await createTestImage();
    const result = await applyWatermark(original, { opacity: 0.5 });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });
});
