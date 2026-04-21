/**
 * Customer Care — FAQ layout + Contact form
 * Palette: brand-brown, parchment, cocoa, linen
 * Calm, reassuring tone
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-main-DCvSGXsexKPMwmhrmBHewa.webp";

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
      "Please visit our Wholesale & Franchise page or contact us directly. We review all partnership inquiries personally.",
  },
];

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ borderBottom: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 md:py-7 flex items-baseline justify-between text-left group"
      >
        <h3
          className="text-base md:text-lg pr-8 transition-opacity duration-300 group-hover:opacity-60"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            letterSpacing: "0.005em",
            color: "oklch(0.34 0.05 45)",
          }}
        >
          {question}
        </h3>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-lg flex-shrink-0"
          style={{
            fontFamily: "var(--font-body)",
            color: "oklch(0.34 0.05 45 / 0.35)",
          }}
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
              className="pb-6 md:pb-7 text-sm max-w-2xl"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 400,
                lineHeight: 1.65,
                color: "oklch(0.34 0.05 45 / 0.6)",
              }}
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
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const submitMutation = trpc.publicEnquiries.submitCustomerCare.useMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        name: form.name,
        email: form.email,
        message: form.message,
      });
      toast.success("Message sent. We will respond within 24 hours.");
      setForm({ name: "", email: "", message: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to send. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    backgroundColor: "transparent",
    borderBottom: "1px solid oklch(0.84 0.025 72)",
    color: "oklch(0.34 0.05 45)",
    fontSize: "14px",
    fontWeight: 400,
  };

  return (
    <PageLayout
      heroImage={usePageImage("customer-care", "hero", DEFAULT_HERO)}
      heroTitle="Customer Care"
      heroSubtitle="We're here to help"
    >
      {/* Introduction — calm, reassuring */}
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
              Your experience matters to us. Whether you have a question about
              our collections, need assistance with a booking, or simply want to
              learn more, we are here to help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        className="py-16 md:py-24 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade} className="mb-10 text-center">
            <span
              className="text-[11px] uppercase block"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              Frequently Asked Questions
            </span>
          </motion.div>

          <div>
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <FAQItem question={faq.question} answer={faq.answer} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-xl mx-auto">
          <motion.div {...fade}>
            <span
              className="text-[11px] uppercase block mb-6 text-center"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              Send Us a Message
            </span>
            <div className="editorial-rule mx-auto mb-12" />

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label
                  className="text-[11px] uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    color: "oklch(0.34 0.05 45 / 0.5)",
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full py-3 px-0 outline-none"
                  style={inputStyle}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  className="text-[11px] uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    color: "oklch(0.34 0.05 45 / 0.5)",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full py-3 px-0 outline-none"
                  style={inputStyle}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label
                  className="text-[11px] uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    color: "oklch(0.34 0.05 45 / 0.5)",
                  }}
                >
                  Message
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full py-3 px-0 outline-none resize-none"
                  style={inputStyle}
                  placeholder="How can we help?"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="text-[11px] uppercase py-3 px-10 transition-all duration-400 hover:opacity-70"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    backgroundColor: "oklch(0.34 0.05 45)",
                    color: "oklch(0.94 0.015 80)",
                  }}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Contact Info */}
      <section
        className="py-16 md:py-20 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div>
                <span
                  className="text-[11px] uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    color: "oklch(0.45 0.06 45 / 0.5)",
                  }}
                >
                  Email
                </span>
                <a
                  href="mailto:hello@queenstbb.com"
                  className="text-sm transition-opacity duration-300 hover:opacity-60"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  hello@queenstbb.com
                </a>
              </div>
              <div>
                <span
                  className="text-[11px] uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    color: "oklch(0.45 0.06 45 / 0.5)",
                  }}
                >
                  Location
                </span>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  Queen Street, Brisbane
                </p>
              </div>
              <div>
                <span
                  className="text-[11px] uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    color: "oklch(0.45 0.06 45 / 0.5)",
                  }}
                >
                  Hours
                </span>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  Daily, 8 AM — 10 PM
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
