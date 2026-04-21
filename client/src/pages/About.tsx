/**
 * About (Brand World) — Strong brand storytelling
 * Palette: brand-brown, parchment, cocoa, linen
 * Emotional and minimal, visual-driven with short text
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-space-mUcyKwAcR2rwS4oEzm2GpP.png";

const SPACE_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-space-d9F8XM8hZ4d35LsKJG8x5i.webp";

const values = [
  {
    title: "Craft",
    text: "Every creation is made by hand, with the patience and precision of an artisan.",
  },
  {
    title: "Provenance",
    text: "We trace every ingredient to its source — from Sicilian pistachios to Lombardy mascarpone.",
  },
  {
    title: "Experience",
    text: "A dessert is more than flavour. It is the space, the vessel, and the moment it creates.",
  },
];

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7 },
};

export default function About() {
  return (
    <PageLayout
      heroImage={usePageImage("about", "hero", DEFAULT_HERO)}
      heroTitle="Brand World"
      heroSubtitle="The story behind the atelier"
    >
      {/* Opening Statement — emotional, minimal */}
      <section className="py-24 md:py-32 px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <div className="editorial-rule mx-auto mb-10" />
            <p
              className="text-xl md:text-2xl font-light leading-[1.7] italic"
              style={{
                fontFamily: "var(--font-display)",
                color: "oklch(0.34 0.05 45)",
              }}
            >
              Queen St BB was born from a simple conviction: that dessert
              deserves the same reverence as fine dining, the same attention as
              haute couture, and the same care as a handwritten letter.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Full-width atmospheric image — visual break */}
      <section className="relative h-[45vh] md:h-[55vh] overflow-hidden">
        <img
          src={SPACE_IMG}
          alt="The atelier"
          className="w-full h-full object-cover"
          style={{
            filter: "saturate(0.8) contrast(0.95)",
            objectPosition: "center 40%",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.94 0.015 80) 0%, transparent 12%, transparent 88%, oklch(0.94 0.015 80) 100%)",
          }}
        />
        <div className="absolute inset-0 film-grain" />
      </section>

      {/* Short narrative — two brief paragraphs */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-2xl mx-auto">
          <motion.div {...fade} className="space-y-6 text-center">
            <p
              className="text-base font-light leading-[1.9]"
              style={{
                fontFamily: "var(--font-body)",
                color: "oklch(0.34 0.05 45 / 0.65)",
              }}
            >
              Founded on Queen Street in Brisbane, our atelier draws from the
              Italian pasticceria tradition — a place where craft, beauty, and
              community converge. We approach each creation with the mindset of
              a designer.
            </p>
            <p
              className="text-base font-light leading-[1.9]"
              style={{
                fontFamily: "var(--font-body)",
                color: "oklch(0.34 0.05 45 / 0.65)",
              }}
            >
              Our space is designed to slow you down — to invite you to sit, to
              savour, to notice the details. Every element has been curated to
              create an experience that feels both timeless and deeply personal.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values — three pillars */}
      <section
        className="py-20 md:py-28 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade} className="text-center mb-14">
            <span
              className="text-[10px] font-medium uppercase block"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.2em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              Our Values
            </span>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center"
              >
                <span
                  className="text-[10px] font-medium uppercase block mb-4"
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.18em",
                    color: "oklch(0.45 0.06 45 / 0.45)",
                  }}
                >
                  0{i + 1}
                </span>
                <h3
                  className="text-xl md:text-2xl font-light mb-4"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  {value.title}
                </h3>
                <p
                  className="text-sm font-light leading-[1.8]"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "oklch(0.34 0.05 45 / 0.55)",
                  }}
                >
                  {value.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing Quote */}
      <section className="py-24 md:py-32 px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <p
              className="text-xl md:text-2xl lg:text-3xl font-light italic leading-[1.6]"
              style={{
                fontFamily: "var(--font-display)",
                color: "oklch(0.34 0.05 45)",
              }}
            >
              "We don't make desserts. We compose moments — layered with care,
              served with intention, remembered with warmth."
            </p>
            <div className="editorial-rule mx-auto mt-10" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
