/**
 * Wholesale & Franchise — Business-focused structure
 * Palette: brand-brown, parchment, cocoa, linen
 * Clear sections: Who we are, What we offer, Contact form
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-objects-ANGDtyQvzsvteisBRsKv35.png";

const offerings = [
  {
    title: "Wholesale",
    points: [
      "Premium tiramisu and gelato for hospitality venues",
      "Custom packaging and private label options",
      "Flexible delivery schedules",
      "Dedicated account management",
    ],
  },
  {
    title: "Franchise",
    points: [
      "Full brand and design system",
      "Training and operational support",
      "Supply chain and sourcing partnerships",
      "Marketing and launch guidance",
    ],
  },
];

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function Wholesale() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    interest: "",
    message: "",
  });

  const submitMutation = trpc.publicEnquiries.submitWholesale.useMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        name: form.name,
        email: form.email,
        company: form.company || undefined,
        interest: form.interest || undefined,
        message: form.message,
      });
      toast.success("Thank you. We will be in touch shortly.");
      setForm({ name: "", company: "", email: "", interest: "", message: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit. Please try again.");
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
    fontWeight: 300,
  };

  return (
    <PageLayout
      heroImage={usePageImage("wholesale", "hero", DEFAULT_HERO)}
      heroTitle="Wholesale & Franchise"
      heroSubtitle="Partner with us"
    >
      {/* Who We Are */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade}>
            <span
              className="text-[10px] font-medium uppercase block mb-6 text-center"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.2em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              Who We Are
            </span>
            <div className="editorial-rule mx-auto mb-10" />
            <p
              className="text-lg md:text-xl font-light leading-[1.8] text-center"
              style={{
                fontFamily: "var(--font-display)",
                color: "oklch(0.34 0.05 45 / 0.8)",
              }}
            >
              Queen St BB is a dessert-based lifestyle brand rooted in Italian
              craft and editorial sensibility. We create tiramisu, gelato, and
              curated objects that transform the everyday into something
              meaningful.
            </p>
            <p
              className="text-base font-light leading-[1.8] text-center mt-6"
              style={{
                fontFamily: "var(--font-body)",
                color: "oklch(0.34 0.05 45 / 0.55)",
              }}
            >
              Our partners share our commitment to quality, craft, and the
              belief that dessert is an experience — not just a product.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What We Offer */}
      <section
        className="py-20 md:py-28 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade} className="text-center mb-14">
            <span
              className="text-[10px] font-medium uppercase block mb-6"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.2em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              What We Offer
            </span>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {offerings.map((offer, i) => (
              <motion.div
                key={offer.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="p-8 md:p-10"
                style={{
                  backgroundColor: "oklch(0.94 0.015 80)",
                  border: "1px solid oklch(0.84 0.025 72 / 0.5)",
                }}
              >
                <h3
                  className="text-2xl md:text-3xl font-light mb-6"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  {offer.title}
                </h3>
                <ul className="space-y-3">
                  {offer.points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span
                        className="mt-2 w-1 h-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: "oklch(0.45 0.06 45 / 0.4)" }}
                      />
                      <span
                        className="text-sm font-light leading-relaxed"
                        style={{
                          fontFamily: "var(--font-body)",
                          color: "oklch(0.34 0.05 45 / 0.6)",
                        }}
                      >
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
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
              className="text-[10px] font-medium uppercase block mb-6 text-center"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.2em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              Get in Touch
            </span>
            <div className="editorial-rule mx-auto mb-12" />

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label
                  className="text-[10px] font-medium uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.15em",
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
                  className="text-[10px] font-medium uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.15em",
                    color: "oklch(0.34 0.05 45 / 0.5)",
                  }}
                >
                  Company
                </label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full py-3 px-0 outline-none"
                  style={inputStyle}
                  placeholder="Company name"
                />
              </div>

              <div>
                <label
                  className="text-[10px] font-medium uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.15em",
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
                  placeholder="email@company.com"
                />
              </div>

              <div>
                <label
                  className="text-[10px] font-medium uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.15em",
                    color: "oklch(0.34 0.05 45 / 0.5)",
                  }}
                >
                  Interest
                </label>
                <select
                  required
                  value={form.interest}
                  onChange={(e) => setForm({ ...form, interest: e.target.value })}
                  className="w-full py-3 px-0 outline-none appearance-none"
                  style={inputStyle}
                >
                  <option value="" disabled>
                    Select your interest
                  </option>
                  <option value="wholesale">Wholesale</option>
                  <option value="franchise">Franchise</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label
                  className="text-[10px] font-medium uppercase block mb-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.15em",
                    color: "oklch(0.34 0.05 45 / 0.5)",
                  }}
                >
                  Message
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full py-3 px-0 outline-none resize-none"
                  style={inputStyle}
                  placeholder="Tell us about your business"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="text-[10px] font-medium uppercase py-3 px-10 transition-all duration-400 hover:opacity-70"
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.2em",
                    backgroundColor: "oklch(0.34 0.05 45)",
                    color: "oklch(0.94 0.015 80)",
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Inquiry"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
