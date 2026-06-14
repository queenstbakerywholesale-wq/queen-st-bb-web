/**
 * Tiramisu — Editorial product page
 * Typography: Playfair Display 500 headings, Inter 400 body
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-tiramisu-5h2ZTWStaR9kXHw97oAsV7.webp";

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

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function Tiramisu() {
  const heroImage = usePageImage("tiramisu", "hero", DEFAULT_HERO);

  return (
    <PageLayout
      heroImage={heroImage}
      heroTitle="Tiramisu"
      heroSubtitle="The art of layered indulgence"
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
              Each tiramisu is crafted by hand in our atelier, layered with
              intention and served as a moment of quiet indulgence. We source
              mascarpone from Lombardy, espresso from a single-origin roaster,
              and cocoa from Valrhona's finest reserves.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Flavour Collection */}
      <section className="pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade} className="text-center mb-12">
            <span
              className="text-[11px] uppercase block mb-3"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              The Collection
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                letterSpacing: "0.06em",
                backgroundColor: "oklch(0.34 0.05 45 / 0.08)",
                color: "oklch(0.34 0.05 45 / 0.7)",
                border: "1px solid oklch(0.34 0.05 45 / 0.12)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/></svg>
              Dine-in Only
            </span>
          </motion.div>

          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: "1px", backgroundColor: "oklch(0.84 0.025 72 / 0.4)" }}
          >
            {flavours.map((flavour, i) => (
              <motion.div
                key={flavour.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="p-8 md:p-12 group transition-colors duration-500"
                style={{ backgroundColor: "oklch(0.94 0.015 80)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "oklch(0.91 0.02 75)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "oklch(0.94 0.015 80)")
                }
              >
                <span
                  className="text-[11px] uppercase block mb-4"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    color: "oklch(0.45 0.06 45 / 0.5)",
                  }}
                >
                  {flavour.note}
                </span>
                <h3
                  className="text-2xl md:text-3xl mb-3 transition-opacity duration-300 group-hover:opacity-70"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    letterSpacing: "0.005em",
                    lineHeight: 1.15,
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  {flavour.name}
                </h3>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 400,
                    lineHeight: 1.6,
                    color: "oklch(0.34 0.05 45 / 0.65)",
                  }}
                >
                  {flavour.description}
                </p>
              </motion.div>
            ))}
          </div>
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
              className="text-xl md:text-2xl lg:text-3xl italic"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                lineHeight: 1.5,
                color: "oklch(0.34 0.05 45)",
              }}
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
