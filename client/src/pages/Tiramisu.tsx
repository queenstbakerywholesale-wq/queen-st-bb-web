/**
 * Tiramisu — an editorial flavour directory with exact recipe and allergen notes.
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-tiramisu-5h2ZTWStaR9kXHw97oAsV7.webp";
const TIRAMISU_CROSS_SECTION = "/manus-storage/tiramisu-ladyfinger-cross-section_b789093e.jpeg";
const FRESH_CHERRIES = "/manus-storage/fresh-cherries_0f83cdd4.jpeg";
const TIRAMISU_MOUTH = "/manus-storage/tiramisu-mouth_540109b1.jpeg";
const TIRAMISU_QUEEN = "/manus-storage/tiramisu-queen_d15d0080.jpeg";

type Flavour = {
  name: string;
  details: string[];
};

const flavours: Flavour[] = [
  {
    name: "Cherry Noir Bloom",
    details: [
      "Ladyfingers: Gluten, Egg",
      "Cream: Dairy",
      "Coffee: Caffeine",
      "May contain traces of Nuts, Soy, Sesame",
    ],
  },
  {
    name: "Queen's Original",
    details: [
      "Ladyfingers: Gluten, Egg",
      "Cream: Dairy",
      "Coffee: Caffeine",
      "May contain traces of Nuts, Soy, Sesame",
    ],
  },
  {
    name: "Blueberry & Earlgrey Bloom",
    details: [
      "Ladyfingers: Gluten, Egg",
      "Cream: Dairy",
      "Coffee: Caffeine",
      "May contain traces of Nuts, Soy, Sesame",
    ],
  },
  {
    name: "Verde Dolce PISTACCHIO",
    details: [
      "Ladyfingers: Gluten, Egg",
      "Cream: Dairy",
      "Coffee: Caffeine",
      "Pistacchio: Gluten, nut, tree nut",
    ],
  },
  {
    name: "MANGO CROWN",
    details: [
      "Ladyfingers: Gluten, Egg",
      "Cream: Dairy",
      "Coffee: Caffeine",
      "May contain traces of Nuts, Soy, Sesame",
    ],
  },
  {
    name: "MATCHA forest",
    details: [
      "Ladyfingers: Gluten, Egg",
      "Cream: Dairy",
      "Matcha: Caffeine",
      "Mulberry: Caffeine",
      "May contain traces of Nuts, Soy, Sesame",
    ],
  },
  {
    name: "Loyal BANANA",
    details: [
      "Ladyfingers: Gluten, Egg",
      "Cream: Dairy",
      "Coffee: Caffeine",
      "May contain traces of Nuts, Soy, Sesame",
    ],
  },
  {
    name: "Golden Biscoff Lotus",
    details: [
      "Ladyfingers: Gluten, Egg",
      "Cream: Dairy",
      "Coffee: Caffeine",
      "Lotus: Gluten, Egg, Soy",
      "May contain traces of Nuts, Sesame",
    ],
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
      <section className="px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
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
              Made fresh in our atelier every day, each tiramisu is given a full
              24 hours to rest before it is served. We work toward a ladyfinger
              that feels light and sponge-like, use wholesome ingredients, and
              never use artificial flavours or colours.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-10 md:pb-28">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-[1.05fr_0.95fr] md:items-stretch">
          <motion.div {...fade} className="grid grid-cols-2 gap-3">
            <img src={TIRAMISU_CROSS_SECTION} alt="Fresh tiramisu showing creamy layers and sponge-like ladyfingers" className="h-full min-h-[320px] w-full rounded-[2px] object-cover" />
            <div className="grid gap-3">
              <img src={TIRAMISU_MOUTH} alt="Tiramisu enjoyed as a sensory dessert ritual" className="h-full min-h-[155px] w-full rounded-[2px] object-cover object-center" />
              <img src={FRESH_CHERRIES} alt="Fresh cherries used as a seasonal ingredient" className="h-full min-h-[155px] w-full rounded-[2px] object-cover" />
            </div>
          </motion.div>
          <motion.div {...fade} className="flex flex-col justify-between rounded-[2px] p-8 md:p-12" style={{ backgroundColor: "oklch(0.91 0.02 75)" }}>
            <div>
              <span className="mb-5 block text-[11px] uppercase tracking-[0.16em] text-brand-cocoa/65">The Queen St BB method</span>
              <h2 className="font-serif text-4xl italic leading-tight text-brand-brown md:text-5xl">Patience makes the texture.</h2>
              <p className="mt-7 text-sm leading-7 text-brand-brown/75 md:text-base">The first spoonful should be soft, airy and deeply soaked — never heavy. We make our ladyfingers to behave more like a delicate sponge, then let every layer settle overnight so the coffee, cream and cocoa become one calm, balanced bite.</p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-brand-brown/20 pt-6 text-[11px] uppercase tracking-[0.1em] text-brand-cocoa/75">
              <div><strong className="block text-brand-brown">Daily</strong>Made fresh</div>
              <div><strong className="block text-brand-brown">24 hours</strong>Rested before service</div>
              <div><strong className="block text-brand-brown">No artificial</strong>Flavours or colours</div>
              <div><strong className="block text-brand-brown">Whole ingredients</strong>Chosen with care</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-10 md:pb-28">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fade} className="mb-12 text-center">
            <span
              className="mb-3 block text-[11px] uppercase"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                letterSpacing: "0.14em",
                color: "oklch(0.45 0.06 45 / 0.58)",
              }}
            >
              The Collection
            </span>
            <h2
              className="mb-5 text-4xl md:text-5xl"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                color: "oklch(0.34 0.05 45)",
              }}
            >
              Eight layered signatures
            </h2>
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] uppercase"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                letterSpacing: "0.08em",
                backgroundColor: "oklch(0.34 0.05 45 / 0.08)",
                color: "oklch(0.34 0.05 45 / 0.72)",
                border: "1px solid oklch(0.34 0.05 45 / 0.14)",
              }}
            >
              <span aria-hidden="true">◌</span>
              Dine-in Only
            </span>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {flavours.map((flavour, i) => (
              <motion.article
                key={flavour.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className="group relative overflow-hidden rounded-[2px] p-7 transition-transform duration-500 hover:-translate-y-1 md:p-10"
                style={{
                  background:
                    i % 2 === 0
                      ? "linear-gradient(135deg, oklch(0.35 0.05 45), oklch(0.28 0.045 45))"
                      : "linear-gradient(135deg, oklch(0.90 0.025 75), oklch(0.95 0.018 82))",
                  boxShadow: "0 12px 35px oklch(0.25 0.03 45 / 0.08)",
                }}
              >
                <div
                  className="absolute right-7 top-7 h-16 w-16 rounded-full border opacity-20 transition-transform duration-700 group-hover:scale-125"
                  style={{ borderColor: i % 2 === 0 ? "#f4eee2" : "#5a3a2e" }}
                />
                <div className="relative z-10 flex min-h-[245px] flex-col justify-between">
                  <div>
                    <div className="mb-7 flex items-start justify-between gap-4">
                      <span
                        className="text-[10px] uppercase"
                        style={{
                          fontFamily: "var(--font-body)",
                          letterSpacing: "0.16em",
                          color: i % 2 === 0 ? "oklch(0.92 0.02 80 / 0.6)" : "oklch(0.34 0.05 45 / 0.55)",
                        }}
                      >
                        0{i + 1} / Tiramisu
                      </span>
                      <span
                        className="rounded-full border px-2.5 py-1 text-[9px] uppercase"
                        style={{
                          fontFamily: "var(--font-body)",
                          letterSpacing: "0.08em",
                          color: i % 2 === 0 ? "#f4eee2" : "#5a3a2e",
                          borderColor: i % 2 === 0 ? "oklch(0.92 0.02 80 / 0.35)" : "oklch(0.34 0.05 45 / 0.25)",
                        }}
                      >
                        Halal
                      </span>
                    </div>
                    <h3
                      className="max-w-[85%] text-3xl md:text-4xl"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 500,
                        lineHeight: 1.08,
                        color: i % 2 === 0 ? "#f4eee2" : "oklch(0.34 0.05 45)",
                      }}
                    >
                      {flavour.name}
                    </h3>
                  </div>
                  <ul
                    className="mt-8 space-y-2 text-xs md:text-sm"
                    style={{
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.45,
                      color: i % 2 === 0 ? "oklch(0.92 0.02 80 / 0.78)" : "oklch(0.34 0.05 45 / 0.7)",
                    }}
                  >
                    {flavour.details.map((detail) => (
                      <li key={detail} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="px-6 py-20 md:px-10 md:py-28"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <motion.div {...fade}>
            <p
              className="text-xl italic md:text-2xl lg:text-3xl"
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

      <section className="px-6 pb-20 md:px-10 md:pb-28">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <motion.div {...fade}><img src={TIRAMISU_QUEEN} alt="Queen St BB tiramisu moment in Melbourne" className="max-h-[620px] w-full rounded-[2px] object-cover object-center" /></motion.div>
          <motion.div {...fade} className="max-w-xl md:pl-8">
            <span className="mb-5 block text-[11px] uppercase tracking-[0.16em] text-brand-cocoa/65">Made with intention</span>
            <p className="font-serif text-3xl italic leading-tight text-brand-brown md:text-5xl">A dessert that asks you to slow down.</p>
            <p className="mt-7 text-sm leading-7 text-brand-brown/70 md:text-base">From the first whisk to the final dusting of cocoa, our process is designed around freshness, texture and restraint.</p>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
