import { describe, expect, it } from "vitest";
import { filterFlavours, flavours } from "../client/src/lib/gelatoCatalog";

describe("Gelato flavour catalogue", () => {
  it("shows the complete catalogue by default", () => {
    expect(filterFlavours("All")).toHaveLength(13);
    expect(filterFlavours("All")).toEqual(flavours);
    expect(flavours.find((flavour) => flavour.name === "Mint Chocolate")?.image).toContain("blueocean_");
    expect(flavours.find((flavour) => flavour.name === "Coconut Pistachio")?.image).toContain("pischoc_");
    expect(flavours.find((flavour) => flavour.name === "Strawberry Lovers")?.image).toContain("strawberry_");
  });

  it("keeps vegan filtering explicit and plant-based", () => {
    const veganFlavours = filterFlavours("Vegan");

    expect(veganFlavours).toHaveLength(6);
    expect(veganFlavours.every((flavour) => flavour.tags.includes("Vegan"))).toBe(true);
    expect(veganFlavours.every((flavour) => flavour.contains.includes("plant-based"))).toBe(true);
    expect(veganFlavours.every((flavour) => flavour.section === "Vegan Gelato & Sorbet")).toBe(true);
  });

  it("keeps price and managed image metadata on every flavour card", () => {
    expect(flavours.every((flavour) => flavour.price === "from $7.40 AUD")).toBe(true);
    expect(flavours.every((flavour) => flavour.image.startsWith("/manus-storage/"))).toBe(true);
  });

  it("does not present nut-containing flavours as nut free", () => {
    const nutFree = filterFlavours("Nut Free").map((flavour) => flavour.name);

    expect(nutFree).not.toContain("Peanut Butter");
    expect(nutFree).not.toContain("Coconut Pistachio");
    expect(nutFree).toContain("Mango");
  });
});
