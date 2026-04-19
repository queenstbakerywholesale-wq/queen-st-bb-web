/**
 * Customer Care — Editorial support page
 * Design: "Atelier Dolce" — warm, minimal, editorial FAQ/contact
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "@/components/PageLayout";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-main-DCvSGXsexKPMwmhrmBHewa.webp";

const faqs = [
  {
    question: "What are your opening hours?",
    answer:
      "We are open daily from 8:00 AM to 10:00 PM. Private dining and event bookings may be arranged outside these hours by prior arrangement.",
  },
  {
    question: "Do you cater for dietary requirements?",
    answer:
      "Yes. We offer gluten-free and nut-free options across our tiramisu and gelato collections. Please inform our team of any allergies when ordering.",
  },
  {
    question: "How far in advance should I book a cake?",
    answer:
      "We recommend a minimum of 3 days for standard cakes and 14 days for wedding cakes. Custom creations require a consultation — please reach out to discuss your timeline.",
  },
  {
    question: "Do you offer delivery?",
    answer:
      "We offer delivery within the Brisbane metropolitan area for cake orders. Gelato and tiramisu are best enjoyed in our space, though we can arrange packaging for local collection.",
  },
  {
    question: "Can I visit the atelier?",
    answer:
      "Our space on Queen Street is open to all. We welcome you to visit, explore our collections, and experience the atelier atmosphere firsthand.",
  },
  {
    question: "How do I inquire about wholesale or franchise?",
    answer:
      "Please visit our Wholesale & Franchise page or contact us directly at wholesale@queenstbb.com. We review all partnership inquiries personally.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7 },
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 md:py-8 flex items-baseline justify-between text-left group"
      >
        <h3
          className="text-lg md:text-xl font-light text-espresso group-hover:text-terracotta transition-colors duration-300 pr-8"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {question}
        </h3>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-lg text-espresso/40 flex-shrink-0"
          style={{ fontFamily: "var(--font-body)" }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p
              className="pb-6 md:pb-8 text-sm font-light text-espresso/60 leading-relaxed max-w-2xl"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CustomerCare() {
  return (
    <PageLayout
      heroImage={HERO}
      heroTitle="Customer Care"
      heroSubtitle="We're here to help"
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
              Your experience matters to us. Whether you have a question about
              our collections, need assistance with a booking, or simply want to
              learn more about Queen St BB, we're here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 md:pb-32 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            {...fadeUp}
            className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-10 text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Frequently Asked Questions
          </motion.h2>

          <div>
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <FAQItem question={faq.question} answer={faq.answer} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 md:py-32 px-6 md:px-10 bg-cream">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2
              className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-8"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Contact Us
            </h2>
            <p
              className="text-2xl md:text-3xl font-light text-espresso leading-snug mb-8"
              style={{ fontFamily: "var(--font-display)" }}
            >
              We'd love to hear from you
            </p>

            <div className="space-y-4">
              <a
                href="mailto:hello@queenstbb.com"
                className="block text-sm font-light text-espresso/70 hover:text-terracotta transition-colors duration-300"
                style={{ fontFamily: "var(--font-body)" }}
              >
                hello@queenstbb.com
              </a>
              <p
                className="text-sm font-light text-espresso/50"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Queen Street, Brisbane, QLD
              </p>
              <p
                className="text-sm font-light text-espresso/50"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Open daily, 8:00 AM — 10:00 PM
              </p>
            </div>

            <div className="editorial-rule mx-auto mt-8" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
