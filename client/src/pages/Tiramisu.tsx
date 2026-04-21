/**
 * Tiramisu — Editorial product page
 * Palette: brand-brown #5A3A2E, parchment, cocoa, linen
 * Cinematic imagery, editorial text blocks, warm matte tones
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
              className="text-lg md:text-xl font-light leading-[1.8]"
              style={{
                fontFamily: "var(--font-display)",
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
              className="text-[10px] font-medium uppercase block"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.2em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              The Collection
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
                  className="text-[10px] font-medium uppercase block mb-4"
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.18em",
                    color: "oklch(0.45 0.06 45 / 0.45)",
                  }}
                >
                  {flavour.note}
                </span>
                <h3
                  className="text-2xl md:text-3xl font-light mb-3 transition-opacity duration-300 group-hover:opacity-70"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  {flavour.name}
                </h3>
                <p
                  className="text-sm font-light leading-relaxed"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "oklch(0.34 0.05 45 / 0.55)",
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
              className="text-xl md:text-2xl lg:text-3xl font-light italic leading-[1.6]"
              style={{
                fontFamily: "var(--font-display)",
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
