/**
 * Gelato — Editorial product page
 * Design: "Atelier Dolce" — warm, cinematic, Italian-inspired
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-gelato-bSnt8m7kGiDFqrvhPfDkmW.webp";

const gelatos = [
  { name: "Fior di Latte", origin: "Lombardy", description: "Pure milk, Tahitian vanilla, a whisper of cream" },
  { name: "Pistacchio di Bronte", origin: "Sicily", description: "DOP pistachio from the slopes of Etna" },
  { name: "Stracciatella", origin: "Bergamo", description: "Fior di latte with hand-shaved dark chocolate" },
  { name: "Nocciola", origin: "Piedmont", description: "IGP Tonda Gentile hazelnuts, slow-roasted" },
  { name: "Fragola", origin: "Campania", description: "San Marzano strawberries, lemon zest" },
  { name: "Cioccolato Fondente", origin: "Ecuador", description: "Single-origin 70% cacao, intensely smooth" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7 },
};

export default function Gelato() {
  return (
    <PageLayout
      heroImage={HERO}
      heroTitle="Gelato"
      heroSubtitle="Crafted from tradition, served with intention"
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
              Our gelato begins with the finest ingredients sourced directly from
              Italian producers — each flavour a portrait of its region. Churned
              slowly, served at the perfect temperature, and presented as an
              experience rather than a product.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Flavour List — Editorial Style */}
      <section className="pb-20 md:pb-32 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            {...fadeUp}
            className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-12 text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Seasonal Selection
          </motion.h2>

          <div className="divide-y divide-border">
            {gelatos.map((gelato, i) => (
              <motion.div
                key={gelato.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="py-8 md:py-10 flex flex-col md:flex-row md:items-baseline gap-2 md:gap-0 group"
              >
                <div className="md:w-1/3">
                  <h3
                    className="text-xl md:text-2xl font-light text-espresso group-hover:text-terracotta transition-colors duration-300"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {gelato.name}
                  </h3>
                </div>
                <div className="md:w-1/3">
                  <p
                    className="text-sm font-light text-espresso/50"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {gelato.description}
                  </p>
                </div>
                <div className="md:w-1/3 md:text-right">
                  <span
                    className="text-[10px] font-medium uppercase tracking-editorial text-gold"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {gelato.origin}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 md:py-32 px-6 md:px-10 bg-cream">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2
              className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-8"
              style={{ fontFamily: "var(--font-body)" }}
            >
              The Process
            </h2>
            <p
              className="text-2xl md:text-3xl font-light text-espresso leading-snug"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Slow-churned in small batches daily. No artificial colours, no
              preservatives, no shortcuts. Just the honest craft of Italian
              gelato-making, refined for the modern palate.
            </p>
            <div className="editorial-rule mx-auto mt-8" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
