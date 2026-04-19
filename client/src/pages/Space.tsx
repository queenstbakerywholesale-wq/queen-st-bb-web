/**
 * Space / Experience — Editorial magazine-style layout
 * Palette: brand-brown, parchment, cocoa, linen
 * Full-width imagery, immersive and emotional mood
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

const HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-space-d9F8XM8hZ4d35LsKJG8x5i.webp";

const experiences = [
  {
    title: "The Salon",
    description:
      "An intimate space designed for unhurried conversation. Velvet seating, marble surfaces, and the warm glow of brass fixtures create an atmosphere that invites you to linger.",
    detail: "Seats 24 guests",
  },
  {
    title: "The Counter",
    description:
      "Watch our artisans at work from the marble counter — a front-row seat to the craft of dessert-making. Each creation assembled with the precision of a couture atelier.",
    detail: "6 counter seats",
  },
  {
    title: "Private Dining",
    description:
      "A secluded room for celebrations and gatherings. Custom dessert menus, curated beverages, and an atmosphere of quiet luxury for up to twelve guests.",
    detail: "By reservation",
  },
];

const fade = {
  initial: { opacity: 0, y: 25 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
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
              Queen St BB is more than a destination — it is an experience
              designed for the senses. Every detail, from the terracotta tiles
              to the hand-selected furnishings, has been curated to create a
              space that feels both timeless and intimately personal.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Full-width atmospheric image break */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={HERO}
          alt="Interior atmosphere"
          className="w-full h-full object-cover"
          style={{
            filter: "saturate(0.8) contrast(0.95)",
            objectPosition: "center 30%",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.94 0.015 80) 0%, transparent 15%, transparent 85%, oklch(0.94 0.015 80) 100%)",
          }}
        />
        <div className="absolute inset-0 film-grain" />
      </section>

      {/* Experience Sections — magazine editorial layout */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade} className="mb-16 text-center">
            <span
              className="text-[10px] font-medium uppercase block mb-6"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.2em",
                color: "oklch(0.45 0.06 45 / 0.6)",
              }}
            >
              The Experience
            </span>
          </motion.div>

          {experiences.map((exp, i) => (
            <motion.div
              key={exp.title}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="py-14 md:py-18"
              style={{
                borderBottom:
                  i < experiences.length - 1
                    ? "1px solid oklch(0.84 0.025 72 / 0.5)"
                    : "none",
              }}
            >
              <div className="flex flex-col md:flex-row gap-6 md:gap-16">
                <div className="md:w-1/3">
                  <span
                    className="text-[10px] font-medium uppercase block mb-3"
                    style={{
                      fontFamily: "var(--font-body)",
                      letterSpacing: "0.18em",
                      color: "oklch(0.45 0.06 45 / 0.5)",
                    }}
                  >
                    0{i + 1}
                  </span>
                  <h3
                    className="text-2xl md:text-3xl font-light mb-2"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "oklch(0.34 0.05 45)",
                    }}
                  >
                    {exp.title}
                  </h3>
                  <span
                    className="text-[10px] font-light uppercase"
                    style={{
                      fontFamily: "var(--font-body)",
                      letterSpacing: "0.15em",
                      color: "oklch(0.62 0.02 60)",
                    }}
                  >
                    {exp.detail}
                  </span>
                </div>
                <div className="md:w-2/3">
                  <p
                    className="text-base font-light leading-[1.8]"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "oklch(0.34 0.05 45 / 0.65)",
                    }}
                  >
                    {exp.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visit Section */}
      <section
        className="py-20 md:py-28 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <span
              className="text-[10px] font-medium uppercase block mb-8"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.2em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              Visit Us
            </span>
            <p
              className="text-2xl md:text-3xl font-light mb-4"
              style={{
                fontFamily: "var(--font-display)",
                color: "oklch(0.34 0.05 45)",
                lineHeight: "1.4",
              }}
            >
              Queen Street, Brisbane
            </p>
            <p
              className="text-sm font-light leading-relaxed"
              style={{
                fontFamily: "var(--font-body)",
                color: "oklch(0.34 0.05 45 / 0.5)",
              }}
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
