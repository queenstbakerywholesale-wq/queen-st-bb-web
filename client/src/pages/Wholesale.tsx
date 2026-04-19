/**
 * Wholesale & Franchise — Business inquiry page
 * Design: "Atelier Dolce" — professional yet editorial, warm tones
 */
import { motion } from "framer-motion";
import PageLayout from "@/components/PageLayout";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-objects-ANGDtyQvzsvteisBRsKv35.png";

const offerings = [
  {
    title: "Wholesale",
    description:
      "Supply your establishment with Queen St BB's signature tiramisu, gelato, and confections. We work with select restaurants, hotels, and retailers who share our commitment to quality.",
    details: ["Minimum order quantities apply", "Weekly delivery available", "Custom flavour development"],
  },
  {
    title: "Franchise",
    description:
      "Bring the Queen St BB experience to your city. Our franchise programme provides comprehensive support — from interior design consultation to artisan training — ensuring every location embodies our atelier philosophy.",
    details: ["Full brand & design package", "Artisan training programme", "Ongoing operational support"],
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7 },
};

export default function Wholesale() {
  return (
    <PageLayout
      heroImage={HERO}
      heroTitle="Wholesale & Franchise"
      heroSubtitle="Partnership opportunities"
    >
      {/* Introduction */}
      <section className="py-20 md:py-32 px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="editorial-rule mx-auto mb-8" />
            <p
              className="text-lg md:text-xl font-light leading-relaxed text-espresso/80"
              style={{ fontFamily: "var(--font-display)" }}
            >
              We believe in thoughtful partnerships that honour the craft behind
              every creation. Whether you're looking to stock our products or
              bring the full Queen St BB experience to a new location, we'd love
              to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Offerings */}
      <section className="pb-20 md:pb-32 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            {offerings.map((offering, i) => (
              <motion.div
                key={offering.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="bg-ivory p-8 md:p-12"
              >
                <span
                  className="text-[10px] font-medium uppercase tracking-editorial text-terracotta/60 block mb-4"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  0{i + 1}
                </span>
                <h3
                  className="text-2xl md:text-3xl font-light text-espresso mb-4"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {offering.title}
                </h3>
                <p
                  className="text-sm font-light text-espresso/70 leading-relaxed mb-6"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {offering.description}
                </p>
                <ul className="space-y-2">
                  {offering.details.map((detail) => (
                    <li
                      key={detail}
                      className="text-[11px] font-light text-espresso/50 flex items-center gap-2"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <span className="w-1 h-1 rounded-full bg-terracotta/40" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 md:py-32 px-6 md:px-10 bg-cream">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2
              className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-8"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Get in Touch
            </h2>
            <p
              className="text-2xl md:text-3xl font-light text-espresso leading-snug mb-8"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Begin a conversation about partnership
            </p>
            <a
              href="mailto:wholesale@queenstbb.com"
              className="inline-block text-[11px] font-medium uppercase tracking-editorial text-espresso border-b border-espresso/30 pb-1 hover:text-terracotta hover:border-terracotta/50 transition-all duration-300"
              style={{ fontFamily: "var(--font-body)" }}
            >
              wholesale@queenstbb.com
            </a>
            <div className="editorial-rule mx-auto mt-8" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
