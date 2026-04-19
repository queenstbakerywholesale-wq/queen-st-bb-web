/**
 * Objects — Editorial lifestyle & curated products page
 * Design: "Atelier Dolce" — still life editorial, warm materiality
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-objects-aKrCAfQFaFKVp7bwFWiYN7.webp";

const objects = [
  {
    category: "Ceramics",
    items: [
      { name: "Atelier Espresso Cup", detail: "Hand-thrown stoneware, ivory glaze" },
      { name: "Dessert Plate — Terracotta", detail: "Artisan ceramic, matte finish" },
      { name: "Serving Bowl — Marble", detail: "Carrara marble, hand-polished" },
    ],
  },
  {
    category: "Textiles",
    items: [
      { name: "Linen Napkin Set", detail: "Belgian linen, natural dye" },
      { name: "Apron — Atelier Edition", detail: "Washed cotton, brass hardware" },
    ],
  },
  {
    category: "Confections",
    items: [
      { name: "Chocolate Collection", detail: "Single-origin, hand-tempered" },
      { name: "Biscotti Gift Box", detail: "Almond & pistachio, wrapped in tissue" },
      { name: "House Blend Coffee", detail: "Medium roast, notes of caramel & hazelnut" },
    ],
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7 },
};

export default function Objects() {
  return (
    <PageLayout
      heroImage={HERO}
      heroTitle="Objects"
      heroSubtitle="Curated for the everyday ritual"
    >
      {/* Editorial Introduction */}
      <section className="py-20 md:py-32 px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="editorial-rule mx-auto mb-8" />
            <p
              className="text-lg md:text-xl font-light leading-relaxed text-espresso/80"
              style={{ fontFamily: "var(--font-display)" }}
            >
              A carefully curated selection of objects that extend the Queen St BB
              experience into your home. Each piece is chosen for its craft,
              materiality, and ability to elevate the everyday.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Object Categories */}
      <section className="pb-20 md:pb-32 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          {objects.map((category, ci) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: ci * 0.15 }}
              className={`py-12 md:py-16 ${
                ci < objects.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <h2
                className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-8"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {category.category}
              </h2>

              <div className="space-y-6">
                {category.items.map((item, ii) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: ii * 0.08 }}
                    className="flex flex-col md:flex-row md:items-baseline justify-between group"
                  >
                    <h3
                      className="text-xl md:text-2xl font-light text-espresso group-hover:text-terracotta transition-colors duration-300"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="text-sm font-light text-espresso/50 mt-1 md:mt-0"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {item.detail}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 px-6 md:px-10 bg-cream">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <p
              className="text-2xl md:text-3xl font-light text-espresso leading-snug italic"
              style={{ fontFamily: "var(--font-display)" }}
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
