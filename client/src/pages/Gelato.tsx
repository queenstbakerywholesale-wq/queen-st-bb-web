/**
 * Gelato — Editorial product page
 * Typography: Playfair Display 500 headings, Inter 400 body
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-gelato-bSnt8m7kGiDFqrvhPfDkmW.webp";

const gelatoFlavours = [
  {
    name: "Brown Butter",
    description: "Toasted brown butter gelato with a warm, nutty finish",
    note: "Signature",
  },
  {
    name: "Peanut Butter",
    description: "Silky roasted peanut butter with a delicate salted finish",
  },
  {
    name: "Burnt Caramel",
    description: "Deep caramelised sugar with a gently smoky sweetness",
  },
  {
    name: "Strawberry Matcha",
    description: "Ceremonial matcha layered with bright strawberry cream",
  },
  {
    name: "Strawberry Lovers",
    description: "Ripe strawberries folded through a soft, creamy gelato",
  },
  {
    name: "Chocchip Honey Comb",
    description: "Dark chocolate chips with crisp honeycomb and cream",
  },
];

const veganSorbets = [
  {
    name: "Lemon",
    description: "Vibrant Sicilian lemon sorbet with a crisp, refreshing tang",
  },
  {
    name: "Lemon Acai",
    description: "Zesty lemon infused with antioxidant-rich organic acai berry",
  },
  {
    name: "Mango",
    description: "Pure Alphonso mango sorbet, intensely tropical and smooth",
  },
  {
    name: "Passionfruit",
    description: "Tangy tropical passionfruit sorbet with aromatic brightness",
  },
  {
    name: "Dark Chocolate",
    description: "Intense dairy-free single-origin dark chocolate sorbet",
  },
  {
    name: "Coconut Pistachio",
    description: "Rich coconut milk blended with roasted pistachio paste",
  },
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

      {/* Gelato Section */}
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
              Gelato Collection
            </span>
            <h2
              className="text-3xl md:text-4xl mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                color: "oklch(0.34 0.05 45)",
              }}
            >
              Artisanal Gelato
            </h2>
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
            {gelatoFlavours.map((flavour, i) => (
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
                {flavour.note && (
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
                )}
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

      {/* Vegan Gelato Sorbet Section */}
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
              Plant-Based Selection
            </span>
            <h2
              className="text-3xl md:text-4xl mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                color: "oklch(0.34 0.05 45)",
              }}
            >
              Vegan Gelato & Sorbet
            </h2>
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
              100% Plant-Based
            </span>
          </motion.div>

          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: "1px", backgroundColor: "oklch(0.84 0.025 72 / 0.4)" }}
          >
            {veganSorbets.map((flavour, i) => (
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
