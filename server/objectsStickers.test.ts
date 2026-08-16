import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const objectsPageSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Objects.tsx"),
  "utf8"
);

describe("Objects Stickers catalog", () => {
  it("includes Stickers in the category order and removes the public Others section", () => {
    expect(objectsPageSource).toContain(
      'const categoryOrder = ["Mugs", "Tumblers", "Caps", "Eco Bags", "Postcards", "Stickers", "Dolls"];'
    );
    expect(objectsPageSource).toContain(
      'if (catName === "Other" || catName === "Others") continue;'
    );
    expect(objectsPageSource).not.toContain(
      'const categoryOrder = ["Mugs", "Tumblers", "Caps", "Eco Bags", "Postcards", "Other"];'
    );
  });

  it("uses contain fitting for Sticker product images in cards and details", () => {
    expect(objectsPageSource).toContain(
      'objectFit={category.category === "Stickers" ? "contain" : "cover"}'
    );
    expect(objectsPageSource).toContain(
      'objectFit={selectedProduct.category === "Stickers" ? "contain" : "cover"}'
    );
  });
});
