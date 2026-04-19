/**
 * About — Editorial brand story page
 * Design: "Atelier Dolce" — narrative, warm, cinematic
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-space-mUcyKwAcR2rwS4oEzm2GpP.png";

const values = [
  {
    title: "Craft",
    text: "Every creation is made by hand, with the patience and precision of an artisan. We believe in the beauty of slow processes and the integrity of traditional techniques.",
  },
  {
    title: "Provenance",
    text: "We trace every ingredient to its source — from Sicilian pistachios to Lombardy mascarpone. Quality begins at the origin, and we honour that journey in every bite.",
  },
  {
    title: "Experience",
    text: "A dessert is more than flavour. It is the space in which it is enjoyed, the vessel from which it is served, and the moment it creates. We design for all of this.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7 },
};

export default function About() {
  return (
    <PageLayout
      heroImage={HERO}
      heroTitle="About"
      heroSubtitle="The story behind the atelier"
    >
      {/* Brand Story */}
      <section className="py-20 md:py-32 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="editorial-rule mx-auto mb-8" />
            <p
              className="text-lg md:text-xl font-light leading-relaxed text-espresso/80"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Queen St BB was born from a simple conviction: that dessert deserves
              the same reverence as fine dining, the same attention as haute couture,
              and the same care as a handwritten letter.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp}
            className="space-y-6"
          >
            <p
              className="text-base font-light text-espresso/70 leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Founded on Queen Street in Brisbane, our atelier draws inspiration
              from the Italian tradition of the pasticceria — a place where craft,
              beauty, and community converge. We approach each creation with the
              mindset of a designer: every layer, every texture, every presentation
              is intentional.
            </p>
            <p
              className="text-base font-light text-espresso/70 leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Our space is designed to slow you down — to invite you to sit, to
              savour, to notice the details. From the marble counters to the
              hand-selected ceramics, every element has been curated to create an
              experience that feels both timeless and deeply personal.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="pb-20 md:pb-32 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            {...fadeUp}
            className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-12 text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Our Values
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="bg-ivory p-8 md:p-10"
              >
                <span
                  className="text-[10px] font-medium uppercase tracking-editorial text-terracotta/60 block mb-4"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  0{i + 1}
                </span>
                <h3
                  className="text-xl md:text-2xl font-light text-espresso mb-4"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {value.title}
                </h3>
                <p
                  className="text-sm font-light text-espresso/60 leading-relaxed"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {value.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Quote */}
      <section className="py-20 md:py-32 px-6 md:px-10 bg-cream">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <p
              className="text-2xl md:text-3xl lg:text-4xl font-light text-espresso leading-snug italic"
              style={{ fontFamily: "var(--font-display)" }}
            >
              "We don't make desserts. We compose moments — layered with care,
              served with intention, remembered with warmth."
            </p>
            <div className="editorial-rule mx-auto mt-8" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
