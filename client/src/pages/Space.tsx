/**
 * Space / Experience — Editorial interior & experience page
 * Design: "Atelier Dolce" — cinematic, warm, atmospheric
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-space-d9F8XM8hZ4d35LsKJG8x5i.webp";

const experiences = [
  {
    title: "The Salon",
    description:
      "An intimate space designed for unhurried conversation. Velvet seating, marble surfaces, and the warm glow of brass fixtures create an atmosphere that invites you to linger.",
  },
  {
    title: "The Counter",
    description:
      "Watch our artisans at work from the marble counter — a front-row seat to the craft of dessert-making. Each creation assembled with the precision of a couture atelier.",
  },
  {
    title: "Private Dining",
    description:
      "A secluded room for celebrations and gatherings. Custom dessert menus, curated beverages, and an atmosphere of quiet luxury for up to twelve guests.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7 },
};

export default function Space() {
  return (
    <PageLayout
      heroImage={HERO}
      heroTitle="The Space"
      heroSubtitle="Where craft meets ceremony"
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
              Queen St BB is more than a destination — it is an experience
              designed for the senses. Every detail, from the terracotta tiles
              to the hand-selected furnishings, has been curated to create a
              space that feels both timeless and intimately personal.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Experience Sections */}
      <section className="pb-20 md:pb-32 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className={`flex flex-col md:flex-row gap-8 md:gap-16 py-16 md:py-20 ${
                i < experiences.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="md:w-1/3">
                <span
                  className="text-[10px] font-medium uppercase tracking-editorial text-terracotta/60 block mb-3"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  0{i + 1}
                </span>
                <h3
                  className="text-2xl md:text-3xl font-light text-espresso"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {exp.title}
                </h3>
              </div>
              <div className="md:w-2/3">
                <p
                  className="text-base font-light text-espresso/70 leading-relaxed"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {exp.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visit Section */}
      <section className="py-20 md:py-32 px-6 md:px-10 bg-cream">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2
              className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-8"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Visit Us
            </h2>
            <p
              className="text-2xl md:text-3xl font-light text-espresso leading-snug mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Queen Street, Brisbane
            </p>
            <p
              className="text-sm font-light text-espresso/60 leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Open daily, 8:00 AM — 10:00 PM
            </p>
            <div className="editorial-rule mx-auto mt-8" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
