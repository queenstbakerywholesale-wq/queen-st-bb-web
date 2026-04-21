/**
 * Objects — Minimal shop layout with live product data
 * Palette: brand-brown, parchment, cocoa, linen
 * Clean, premium presentation — focus on product and spacing
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import PageLayout from "@/components/PageLayout";

const HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-objects-aKrCAfQFaFKVp7bwFWiYN7.webp";

// Fallback static data when no products in DB
const fallbackObjects = [
  {
    category: "Ceramics",
    items: [
      { name: "Atelier Espresso Cup", detail: "Hand-thrown stoneware, ivory glaze", price: "$48", imageUrl: "" },
      { name: "Dessert Plate — Terracotta", detail: "Artisan ceramic, matte finish", price: "$62", imageUrl: "" },
      { name: "Serving Bowl — Marble", detail: "Carrara marble, hand-polished", price: "$185", imageUrl: "" },
    ],
  },
  {
    category: "Textiles",
    items: [
      { name: "Linen Napkin Set", detail: "Belgian linen, natural dye", price: "$38", imageUrl: "" },
      { name: "Apron — Atelier Edition", detail: "Washed cotton, brass hardware", price: "$95", imageUrl: "" },
    ],
  },
  {
    category: "Confections",
    items: [
      { name: "Chocolate Collection", detail: "Single-origin, hand-tempered", price: "$42", imageUrl: "" },
      { name: "Biscotti Gift Box", detail: "Almond & pistachio, wrapped in tissue", price: "$36", imageUrl: "" },
      { name: "House Blend Coffee", detail: "Medium roast, caramel & hazelnut notes", price: "$28", imageUrl: "" },
    ],
  },
];

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function Objects() {
  const { data: liveProducts } = trpc.publicProducts.list.useQuery({
    productType: "merchandise",
    limit: 100,
  });
  const { data: liveCategories } = trpc.publicProducts.categories.useQuery();

  // Group live products by category, or fall back to static data
  const displayData = useMemo(() => {
    if (!liveProducts || liveProducts.length === 0) return fallbackObjects;

    const categoryMap = new Map<number, string>();
    if (liveCategories) {
      for (const c of liveCategories) {
        categoryMap.set(c.id, c.name);
      }
    }

    const grouped: Record<string, { name: string; detail: string; price: string; imageUrl: string }[]> = {};
    for (const p of liveProducts) {
      const catName = p.categoryId ? categoryMap.get(p.categoryId) || "Other" : "Other";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push({
        name: p.name,
        detail: p.shortDescription || "",
        price: `$${Number(p.price).toFixed(0)}`,
        imageUrl: p.imageUrl || "",
      });
    }

    return Object.entries(grouped).map(([category, items]) => ({ category, items }));
  }, [liveProducts, liveCategories]);

  return (
    <PageLayout
      heroImage={HERO}
      heroTitle="Objects"
      heroSubtitle="Curated for the everyday ritual"
    >
      {/* Introduction */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <div className="editorial-rule mx-auto mb-8" />
            <p
              className="text-lg md:text-xl font-light leading-[1.8]"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45 / 0.8)" }}
            >
              A carefully curated selection of objects that extend the Queen St BB
              experience into your home. Each piece chosen for its craft,
              materiality, and quiet beauty.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Product Grid — minimal shop layout */}
      <section className="pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          {displayData.map((category, ci) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: ci * 0.1 }}
              className="mb-16 md:mb-20 last:mb-0"
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-10">
                <span
                  className="text-[10px] font-medium uppercase"
                  style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em", color: "oklch(0.45 0.06 45 / 0.5)" }}
                >
                  {category.category}
                </span>
                <div className="flex-1 h-[1px]" style={{ backgroundColor: "oklch(0.84 0.025 72 / 0.4)" }} />
              </div>

              {/* Items — clean grid with generous spacing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                {category.items.map((item, ii) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: ii * 0.08 }}
                    className="group"
                  >
                    {/* Product image or placeholder */}
                    <div
                      className="aspect-[4/5] mb-5 overflow-hidden"
                      style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span
                            className="text-[10px] font-light uppercase"
                            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.72 0.03 65)" }}
                          >
                            {category.category}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3
                      className="text-base md:text-lg font-light mb-1 group-hover:opacity-60 transition-opacity duration-400"
                      style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="text-[11px] font-light mb-2"
                      style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.45)" }}
                    >
                      {item.detail}
                    </p>
                    <span
                      className="text-sm font-light"
                      style={{ fontFamily: "var(--font-body)", color: "oklch(0.45 0.06 45)" }}
                    >
                      {item.price}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section
        className="py-20 md:py-28 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <p
              className="text-xl md:text-2xl font-light italic leading-[1.7]"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}
            >
              "The objects we choose shape the rituals we keep."
            </p>
            <div className="editorial-rule mx-auto mt-8" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
