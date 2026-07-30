/**
 * Franchise — Detailed enquiry form for franchise opportunities
 * Palette: brand-brown, parchment, cocoa, linen
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-objects-ANGDtyQvzsvteisBRsKv35.png";

const AU_STATES = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "South Australia",
  "Western Australia",
  "Tasmania",
  "Northern Territory",
  "Australian Capital Territory",
];

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function Franchise() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    preferredLocation: "",
    message: "",
  });

  const submitMutation = trpc.publicEnquiries.submit.useMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.name || !form.email || !form.message || !form.preferredLocation) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        type: "franchise",
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        interest: "Franchise Opportunity",
        subject: `Franchise Enquiry from ${form.name}`,
        message: form.message,
        preferredLocation: form.preferredLocation,
      });
      toast.success("Thank you. We will be in touch shortly.");
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        preferredLocation: "",
        message: "",
      });
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
    fontWeight: 400,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    letterSpacing: "0.04em",
    color: "oklch(0.34 0.05 45 / 0.5)",
  };

  return (
    <PageLayout
      heroImage={usePageImage("franchise", "hero", DEFAULT_HERO)}
      heroTitle="Franchise"
      heroSubtitle="Join the Queen St BB family"
    >
      {/* Introduction */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
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
              Franchise Opportunities
            </span>
            <div className="editorial-rule mx-auto mb-10" />
            <p
              className="text-base md:text-lg text-center"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 400,
                lineHeight: 1.7,
                color: "oklch(0.34 0.05 45 / 0.8)",
              }}
            >
              Become part of the Queen St BB story. We're looking for passionate partners who share our commitment to craft, quality, and creating meaningful dessert experiences.
            </p>
            <p
              className="text-base text-center mt-6"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 400,
                lineHeight: 1.65,
                color: "oklch(0.34 0.05 45 / 0.6)",
              }}
            >
              Our franchise model provides comprehensive support including brand guidelines, training, supply chain partnerships, and marketing assistance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What We Offer */}
      <section
        className="py-20 md:py-28 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-3xl mx-auto">
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
              Franchise Support
            </span>
            <div className="editorial-rule mx-auto mb-12" />

            <div className="space-y-6">
              {[
                { title: "Brand & Design", desc: "Complete brand guidelines and design system" },
                { title: "Training", desc: "Comprehensive operational and product training" },
                { title: "Supply Chain", desc: "Established sourcing and supply partnerships" },
                { title: "Marketing", desc: "Launch support and ongoing marketing guidance" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: "oklch(0.45 0.06 45 / 0.4)" }}
                  />
                  <div>
                    <h4
                      className="font-semibold mb-1"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "oklch(0.34 0.05 45)",
                      }}
                    >
                      {item.title}
                    </h4>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        color: "oklch(0.34 0.05 45 / 0.65)",
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-2xl mx-auto">
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
              Franchise Enquiry Form
            </span>
            <div className="editorial-rule mx-auto mb-12" />

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <h3
                  className="text-lg mb-6"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  Personal Information
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full py-3 px-0 outline-none"
                      style={inputStyle}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                      Email Address *
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
                    <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full py-3 px-0 outline-none"
                      style={inputStyle}
                      placeholder="+61 2 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full py-3 px-0 outline-none"
                      style={inputStyle}
                      placeholder="Your company name (if applicable)"
                    />
                  </div>
                </div>
              </div>

              {/* Location Preference Section */}
              <div>
                <h3
                  className="text-lg mb-6"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  Location Preference
                </h3>

                <div>
                  <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                    Preferred Location/Area in Australia *
                  </label>
                  <select
                    required
                    value={form.preferredLocation}
                    onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })}
                    className="w-full py-3 px-0 outline-none appearance-none"
                    style={inputStyle}
                  >
                    <option value="">Select preferred state or area</option>
                    {AU_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                    <option value="other">Other/Multiple locations</option>
                  </select>
                </div>
              </div>

              {/* Message Section */}
              <div>
                <h3
                  className="text-lg mb-6"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  Additional Information
                </h3>

                <div>
                  <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                    Message *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full py-3 px-0 outline-none resize-none"
                    style={inputStyle}
                    placeholder="Tell us about your background, experience, and why you're interested in a Queen St BB franchise..."
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-[11px] uppercase py-3 px-10 transition-all duration-400 hover:opacity-70 disabled:opacity-50"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    backgroundColor: "oklch(0.34 0.05 45)",
                    color: "oklch(0.94 0.015 80)",
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
