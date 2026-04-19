/**
 * Cake Booking — Simple and clean booking form
 * Palette: brand-brown, parchment, cocoa, linen
 * Fields: Name, Date, Cake type, Custom request
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";

const HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-main-kcUndrGpKLvreReb7i8t53.png";

const cakeTypes = [
  { name: "Classic Tiramisu Cake", serves: "8–12", lead: "3 days" },
  { name: "Pistachio Ricotta Cake", serves: "8–10", lead: "3 days" },
  { name: "Dark Chocolate Torta", serves: "10–14", lead: "4 days" },
  { name: "Seasonal Fruit Cake", serves: "8–12", lead: "3 days" },
  { name: "Custom Creation", serves: "Varies", lead: "5 days" },
];

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function CakeBooking() {
  const [form, setForm] = useState({
    name: "",
    date: "",
    cakeType: "",
    request: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Booking request received. We will confirm within 24 hours.");
    setForm({ name: "", date: "", cakeType: "", request: "" });
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
      heroImage={HERO}
      heroTitle="Cake Booking"
      heroSubtitle="Made to order"
    >
      {/* Introduction */}
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
              Each cake is crafted to order in our atelier. Select from our
              collection or describe your vision — we will bring it to life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cake Menu */}
      <section
        className="py-16 md:py-24 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade} className="mb-10 text-center">
            <span
              className="text-[10px] font-medium uppercase block"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.2em",
                color: "oklch(0.45 0.06 45 / 0.5)",
              }}
            >
              Our Collection
            </span>
          </motion.div>

          <div className="space-y-0">
            {cakeTypes.map((cake, i) => (
              <motion.div
                key={cake.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex flex-col md:flex-row md:items-center justify-between py-5"
                style={{
                  borderBottom: "1px solid oklch(0.84 0.025 72 / 0.4)",
                }}
              >
                <h3
                  className="text-base md:text-lg font-light"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "oklch(0.34 0.05 45)",
                  }}
                >
                  {cake.name}
                </h3>
                <div className="flex gap-6 mt-1 md:mt-0">
                  <span
                    className="text-[11px] font-light"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "oklch(0.34 0.05 45 / 0.45)",
                    }}
                  >
                    Serves {cake.serves}
                  </span>
                  <span
                    className="text-[11px] font-light"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "oklch(0.34 0.05 45 / 0.45)",
                    }}
                  >
                    {cake.lead} notice
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form — simple, clean */}
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
              Place a Booking
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
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full py-3 px-0 outline-none"
                  style={inputStyle}
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
                  Cake Type
                </label>
                <select
                  required
                  value={form.cakeType}
                  onChange={(e) => setForm({ ...form, cakeType: e.target.value })}
                  className="w-full py-3 px-0 outline-none appearance-none"
                  style={inputStyle}
                >
                  <option value="" disabled>
                    Select a cake
                  </option>
                  {cakeTypes.map((cake) => (
                    <option key={cake.name} value={cake.name}>
                      {cake.name}
                    </option>
                  ))}
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
                  Custom Request
                </label>
                <textarea
                  rows={4}
                  value={form.request}
                  onChange={(e) => setForm({ ...form, request: e.target.value })}
                  className="w-full py-3 px-0 outline-none resize-none"
                  style={inputStyle}
                  placeholder="Describe your vision — flavours, decorations, dietary needs"
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
                  Submit Booking
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
