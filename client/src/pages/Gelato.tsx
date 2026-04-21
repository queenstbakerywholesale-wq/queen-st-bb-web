/**
 * Gelato — Editorial product page
 * Typography: Playfair Display 500 headings, Inter 400 body
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-gelato-bSnt8m7kGiDFqrvhPfDkmW.webp";

const gelatos = [
  { name: "Fior di Latte", origin: "Lombardy", description: "Pure milk, Tahitian vanilla, a whisper of cream" },
  { name: "Pistacchio di Bronte", origin: "Sicily", description: "DOP pistachio from the slopes of Etna" },
  { name: "Stracciatella", origin: "Bergamo", description: "Fior di latte with hand-shaved dark chocolate" },
  { name: "Nocciola", origin: "Piedmont", description: "IGP Tonda Gentile hazelnuts, slow-roasted" },
  { name: "Fragola", origin: "Campania", description: "San Marzano strawberries, lemon zest" },
  { name: "Cioccolato Fondente", origin: "Ecuador", description: "Single-origin 70% cacao, intensely smooth" },
];

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function Gelato() {
  return (
    <PageLayout
      heroImage={usePageImage("gelato", "hero", DEFAULT_HERO)}
      heroTitle="Gelato"
      heroSubtitle="Crafted from tradition"
    >
      {/* Introduction */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <div className="editorial-rule mx-auto mb-8" />
            <p
              className="text-base md:text-lg"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 400,
                lineHeight: 1.7,
                color: "oklch(0.34 0.05 45 / 0.8)",
              }}
            >
              Our gelato begins with the finest ingredients sourced directly from
              Italian producers — each flavour a portrait of its region. Churned
              slowly, served at the perfect temperature, and presented as an
              experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Flavour List */}
      <section className="pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fade} className="text-center mb-12">
            <span
              className="text-[11px] uppercase block"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              Seasonal Selection
            </span>
          </motion.div>

          <div>
            {gelatos.map((gelato, i) => (
              <motion.div
                key={gelato.name}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="py-7 md:py-8 flex flex-col md:flex-row md:items-baseline gap-2 md:gap-0 group"
                style={{
                  borderBottom: "1px solid oklch(0.84 0.025 72 / 0.4)",
                }}
              >
                <div className="md:w-1/3">
                  <h3
                    className="text-xl md:text-2xl transition-opacity duration-300 group-hover:opacity-60"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                      letterSpacing: "0.005em",
                      lineHeight: 1.15,
                      color: "oklch(0.34 0.05 45)",
                    }}
                  >
                    {gelato.name}
                  </h3>
                </div>
                <div className="md:w-1/3">
                  <p
                    className="text-sm"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 400,
                      lineHeight: 1.6,
                      color: "oklch(0.34 0.05 45 / 0.65)",
                    }}
                  >
                    {gelato.description}
                  </p>
                </div>
                <div className="md:w-1/3 md:text-right">
                  <span
                    className="text-[11px] uppercase"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      color: "oklch(0.62 0.02 60)",
                    }}
                  >
                    {gelato.origin}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section
        className="py-20 md:py-28 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <span
              className="text-[11px] uppercase block mb-8"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              The Process
            </span>
            <p
              className="text-xl md:text-2xl"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                lineHeight: 1.5,
                color: "oklch(0.34 0.05 45)",
              }}
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
