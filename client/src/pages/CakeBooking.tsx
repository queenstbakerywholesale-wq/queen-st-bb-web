/**
 * Cake Booking — Editorial booking/inquiry page
 * Design: "Atelier Dolce" — warm, inviting, editorial form design
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";

const HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-main-kcUndrGpKLvreReb7i8t53.png";

const cakeTypes = [
  { name: "Tiramisu Cake", serves: "8–12 guests", lead: "3 days" },
  { name: "Gelato Cake", serves: "10–15 guests", lead: "5 days" },
  { name: "Celebration Cake", serves: "15–25 guests", lead: "7 days" },
  { name: "Wedding Cake", serves: "30–100 guests", lead: "14 days" },
  { name: "Custom Creation", serves: "Bespoke", lead: "Consultation required" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.7 },
};

export default function CakeBooking() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cakeType: "",
    date: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you for your inquiry. We will be in touch shortly.");
    setFormData({ name: "", email: "", phone: "", cakeType: "", date: "", message: "" });
  };

  return (
    <PageLayout
      heroImage={HERO}
      heroTitle="Cake Booking"
      heroSubtitle="Commission a creation"
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
              Every cake from Queen St BB is a bespoke creation — designed in
              consultation with you and crafted by our artisans. From intimate
              gatherings to grand celebrations, we bring the same care and
              precision to every commission.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cake Types */}
      <section className="pb-16 md:pb-24 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            {...fadeUp}
            className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-10 text-center"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Our Offerings
          </motion.h2>

          <div className="divide-y divide-border">
            {cakeTypes.map((cake, i) => (
              <motion.div
                key={cake.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="py-6 md:py-8 flex flex-col md:flex-row md:items-baseline gap-2 md:gap-0"
              >
                <div className="md:w-2/5">
                  <h3
                    className="text-xl font-light text-espresso"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {cake.name}
                  </h3>
                </div>
                <div className="md:w-1/5">
                  <span
                    className="text-sm font-light text-espresso/50"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {cake.serves}
                  </span>
                </div>
                <div className="md:w-2/5 md:text-right">
                  <span
                    className="text-[10px] font-medium uppercase tracking-editorial text-gold"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Lead time: {cake.lead}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-20 md:py-32 px-6 md:px-10 bg-cream">
        <div className="max-w-xl mx-auto">
          <motion.div {...fadeUp}>
            <h2
              className="text-[11px] font-medium uppercase tracking-editorial text-terracotta mb-10 text-center"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Make an Inquiry
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {[
                { label: "Name", key: "name", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "Phone", key: "phone", type: "tel" },
                { label: "Preferred Date", key: "date", type: "date" },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    className="text-[10px] font-medium uppercase tracking-editorial text-espresso/50 block mb-2"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.key]: e.target.value })
                    }
                    className="w-full bg-transparent border-b border-espresso/20 pb-2 text-sm font-light text-espresso focus:border-terracotta focus:outline-none transition-colors duration-300"
                    style={{ fontFamily: "var(--font-body)" }}
                    required
                  />
                </div>
              ))}

              <div>
                <label
                  className="text-[10px] font-medium uppercase tracking-editorial text-espresso/50 block mb-2"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Cake Type
                </label>
                <select
                  value={formData.cakeType}
                  onChange={(e) =>
                    setFormData({ ...formData, cakeType: e.target.value })
                  }
                  className="w-full bg-transparent border-b border-espresso/20 pb-2 text-sm font-light text-espresso focus:border-terracotta focus:outline-none transition-colors duration-300 appearance-none"
                  style={{ fontFamily: "var(--font-body)" }}
                  required
                >
                  <option value="">Select a type</option>
                  {cakeTypes.map((cake) => (
                    <option key={cake.name} value={cake.name}>
                      {cake.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="text-[10px] font-medium uppercase tracking-editorial text-espresso/50 block mb-2"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={4}
                  className="w-full bg-transparent border-b border-espresso/20 pb-2 text-sm font-light text-espresso focus:border-terracotta focus:outline-none transition-colors duration-300 resize-none"
                  style={{ fontFamily: "var(--font-body)" }}
                  placeholder="Tell us about your vision..."
                />
              </div>

              <div className="pt-4 text-center">
                <button
                  type="submit"
                  className="text-[11px] font-medium uppercase tracking-editorial text-espresso border border-espresso/30 px-10 py-3 hover:bg-espresso hover:text-ivory transition-all duration-300"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Submit Inquiry
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
