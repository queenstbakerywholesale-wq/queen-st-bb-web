/**
 * Wholesale — Detailed enquiry form for wholesale partnerships
 * Palette: brand-brown, parchment, cocoa, linen
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/wholesale-hero-9bqZWRgH4viRL9PaS4XdpH.webp";

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function Wholesale() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    storeAddress: "",
    deliveryAddress: "",
    estimatedOrderQuantity: "",
    businessType: "",
    interest: "",
    message: "",
  });

  const submitMutation = trpc.publicEnquiries.submit.useMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.name || !form.email || !form.company || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        type: "wholesale",
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        interest: form.interest,
        subject: `Wholesale Enquiry from ${form.company}`,
        message: form.message,
        storeAddress: form.storeAddress,
        deliveryAddress: form.deliveryAddress,
        estimatedOrderQuantity: form.estimatedOrderQuantity,
        businessType: form.businessType,
      });
      toast.success("Thank you. We will be in touch shortly.");
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        storeAddress: "",
        deliveryAddress: "",
        estimatedOrderQuantity: "",
        businessType: "",
        interest: "",
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
      heroImage={usePageImage("wholesale", "hero", DEFAULT_HERO)}
      heroTitle="Wholesale"
      heroSubtitle="Partner with us"
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
              Wholesale Opportunities
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
              Queen St BB offers premium tiramisu, gelato, and curated objects for hospitality venues, retailers, and corporate partners. Our products are crafted with Italian precision and editorial sensibility.
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
              Whether you're a café, restaurant, boutique hotel, or specialty retailer, we provide flexible wholesale arrangements with competitive pricing and reliable delivery.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Business Model Benefits */}
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
              Wholesale Benefits
            </span>
            <div className="editorial-rule mx-auto mb-12" />

            <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: "Premium Quality", desc: "Authentic Italian recipes crafted with finest ingredients" },
                { title: "Flexible Ordering", desc: "Customizable order quantities and delivery schedules" },
                { title: "Competitive Pricing", desc: "Volume-based discounts for qualified partners" },
                { title: "Marketing Support", desc: "Co-branded materials and promotional guidance" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <h4
                    className="font-semibold mb-2"
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
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section className="py-20 md:py-28 px-6 md:px-10" style={{ backgroundColor: "oklch(0.91 0.02 75)" }}>
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
              Wholesale Enquiry Form
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
                </div>
              </div>

              {/* Business Information Section */}
              <div>
                <h3
                  className="text-lg mb-6"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  Business Information
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                      Company/Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full py-3 px-0 outline-none"
                      style={inputStyle}
                      placeholder="Your business name"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                      Business Type *
                    </label>
                    <select
                      required
                      value={form.businessType}
                      onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                      className="w-full py-3 px-0 outline-none appearance-none"
                      style={inputStyle}
                    >
                      <option value="">Select business type</option>
                      <option value="cafe">Café</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="retail">Retail Store</option>
                      <option value="hotel">Hotel/Accommodation</option>
                      <option value="corporate">Corporate/Office</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                      Store Address
                    </label>
                    <input
                      type="text"
                      value={form.storeAddress}
                      onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                      className="w-full py-3 px-0 outline-none"
                      style={inputStyle}
                      placeholder="Street address, suburb, postcode"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                      Delivery Address (if different)
                    </label>
                    <input
                      type="text"
                      value={form.deliveryAddress}
                      onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                      className="w-full py-3 px-0 outline-none"
                      style={inputStyle}
                      placeholder="Street address, suburb, postcode"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                      Estimated Order Quantity / Monthly Purchase Volume
                    </label>
                    <input
                      type="text"
                      value={form.estimatedOrderQuantity}
                      onChange={(e) => setForm({ ...form, estimatedOrderQuantity: e.target.value })}
                      className="w-full py-3 px-0 outline-none"
                      style={inputStyle}
                      placeholder="e.g., 50 units/month, $5,000/month"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase block mb-2" style={labelStyle}>
                      Products of Interest
                    </label>
                    <input
                      type="text"
                      value={form.interest}
                      onChange={(e) => setForm({ ...form, interest: e.target.value })}
                      className="w-full py-3 px-0 outline-none"
                      style={inputStyle}
                      placeholder="e.g., Tiramisu, Gelato, Merchandise"
                    />
                  </div>
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
                    placeholder="Tell us more about your business and why you're interested in Queen St BB products..."
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
