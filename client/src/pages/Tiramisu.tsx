/**
 * Tiramisu — Editorial product page
 * Design: "Atelier Dolce" — cinematic imagery, editorial text blocks, warm palette
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-tiramisu-5h2ZTWStaR9kXHw97oAsV7.webp";

const flavours = [
  {
    name: "Classico",
    description: "Mascarpone, espresso-soaked savoiardi, Valrhona cocoa",
    note: "Our signature",
  },
  {
    name: "Pistachio",
    description: "Sicilian pistachio cream, white chocolate, delicate crumb",
    note: "Seasonal favourite",
  },
  {
    name: "Matcha",
    description: "Ceremonial grade Uji matcha, yuzu zest, mascarpone",
    note: "East meets West",
  },
  {
    name: "Strawberry Rose",
    description: "Fresh strawberries, rosewater cream, almond biscuit",
    note: "Limited edition",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7 },
};

export default function Tiramisu() {
  return (
    <PageLayout
      heroImage={HERO}
      heroTitle="Tiramisu"
      heroSubtitle="The art of layered indulgence"
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
              Each tiramisu is crafted by hand in our atelier, layered with intention
              and served as a moment of quiet indulgence. We source mascarpone from
              Lombardy, espresso from a single-origin roaster, and cocoa from
              Valrhona's finest reserves.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Flavour Collection */}
      <section className="pb-20 md:pb-32 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            {...fadeUp}
            className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-12 text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            The Collection
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            {flavours.map((flavour, i) => (
              <motion.div
                key={flavour.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-ivory p-8 md:p-12 group hover:bg-cream transition-colors duration-500"
              >
                <span
                  className="text-[10px] font-medium uppercase tracking-editorial text-terracotta/60 block mb-4"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {flavour.note}
                </span>
                <h3
                  className="text-2xl md:text-3xl font-light text-espresso mb-3 group-hover:text-terracotta transition-colors duration-300"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {flavour.name}
                </h3>
                <p
                  className="text-sm font-light text-espresso/60 leading-relaxed"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {flavour.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Quote */}
      <section className="py-20 md:py-32 px-6 md:px-10 bg-cream">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <p
              className="text-2xl md:text-3xl lg:text-4xl font-light text-espresso leading-snug italic"
              style={{ fontFamily: "var(--font-display)" }}
            >
              "Tiramisu is not a dessert. It is a ritual — a layered meditation
              on patience and pleasure."
            </p>
            <div className="editorial-rule mx-auto mt-8" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
