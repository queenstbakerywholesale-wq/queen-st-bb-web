/**
 * Cake Booking — Simple and clean booking form connected to live data
 * Palette: brand-brown, parchment, cocoa, linen
 * Fields: Name, Phone, Branch, Date, Time slot, Cake type, Custom request
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import PageLayout from "@/components/PageLayout";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-main-kcUndrGpKLvreReb7i8t53.png";

// Fallback cake types when no products in DB yet
const fallbackCakeTypes = [
  "Classic Tiramisu Cake",
  "Pistachio Ricotta Cake",
  "Dark Chocolate Torta",
  "Seasonal Fruit Cake",
  "Custom Creation",
];

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  backgroundColor: "transparent",
  borderBottom: "1px solid oklch(0.84 0.025 72)",
  color: "oklch(0.34 0.05 45)",
  fontSize: "14px",
  fontWeight: 300,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  letterSpacing: "0.15em",
  color: "oklch(0.34 0.05 45 / 0.5)",
};

export default function CakeBooking() {
  const heroImage = usePageImage("cake-booking", "hero", DEFAULT_HERO);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    branchId: 0,
    date: "",
    time: "",
    cakeType: "",
    request: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");

  // Fetch live data
  const { data: branchesData } = trpc.publicBookings.branches.useQuery();
  const { data: cakeProducts } = trpc.publicBookings.cakeProducts.useQuery();

  const [slotsDate] = useMemo(() => [form.date], [form.date]);
  const [slotsBranch] = useMemo(() => [form.branchId], [form.branchId]);

  const { data: slotsData, isLoading: slotsLoading } =
    trpc.publicBookings.checkSlots.useQuery(
      { branchId: slotsBranch, date: slotsDate },
      { enabled: slotsBranch > 0 && slotsDate.length > 0 }
    );

  const submitMutation = trpc.publicBookings.submit.useMutation({
    onSuccess: (data) => {
      setBookingNumber(data.bookingNumber);
      setSubmitted(true);
      toast.success("Booking confirmed!");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const cakeTypeOptions = useMemo(() => {
    if (cakeProducts && cakeProducts.length > 0) {
      return cakeProducts.map((p) => ({ id: p.id, name: p.name }));
    }
    return fallbackCakeTypes.map((name, i) => ({ id: undefined as number | undefined, name }));
  }, [cakeProducts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.cakeType || !form.date) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const selectedProduct = cakeTypeOptions.find((c) => c.name === form.cakeType);

    submitMutation.mutate({
      customerName: form.name,
      customerPhone: form.phone,
      customerEmail: form.email || undefined,
      branchId: form.branchId || 1,
      productName: form.cakeType,
      productId: selectedProduct?.id,
      customRequest: form.request || undefined,
      pickupDate: form.date,
      pickupTime: form.time || "12:00",
    });
  };

  // Get minimum date (tomorrow or today based on branch settings)
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  if (submitted) {
    return (
      <PageLayout heroImage={heroImage} heroTitle="Booking Confirmed" heroSubtitle="Thank you">
        <section className="py-20 md:py-28 px-6 md:px-10">
          <div className="max-w-lg mx-auto text-center">
            <motion.div {...fade}>
              <div className="editorial-rule mx-auto mb-8" />
              <h2
                className="text-2xl md:text-3xl font-light mb-4"
                style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}
              >
                Thank You
              </h2>
              <p
                className="text-sm font-light leading-[1.8] mb-6"
                style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.7)" }}
              >
                Your booking reference is
              </p>
              <p
                className="text-xl font-light tracking-[0.15em] mb-8"
                style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}
              >
                {bookingNumber}
              </p>
              <p
                className="text-sm font-light leading-[1.8]"
                style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.6)" }}
              >
                We will confirm your booking within 24 hours via phone or email.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", phone: "", email: "", branchId: 0, date: "", time: "", cakeType: "", request: "" });
                }}
                className="mt-10 text-[10px] font-medium uppercase py-3 px-10 transition-all duration-400 hover:opacity-70"
                style={{
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.2em",
                  border: "1px solid oklch(0.34 0.05 45 / 0.2)",
                  color: "oklch(0.34 0.05 45)",
                }}
              >
                New Booking
              </button>
            </motion.div>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout heroImage={heroImage} heroTitle="Cake Booking" heroSubtitle="Made to order">
      {/* Introduction */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <div className="editorial-rule mx-auto mb-8" />
            <p
              className="text-lg md:text-xl font-light leading-[1.8]"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45 / 0.8)" }}
            >
              Each cake is crafted to order in our atelier. Select from our
              collection or describe your vision — we will bring it to life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Booking Form */}
      <section
        className="py-16 md:py-24 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-xl mx-auto">
          <motion.div {...fade}>
            <span
              className="text-[10px] font-medium uppercase block mb-6 text-center"
              style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em", color: "oklch(0.45 0.06 45 / 0.5)" }}
            >
              Place a Booking
            </span>
            <div className="editorial-rule mx-auto mb-12" />

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Name */}
              <div>
                <label className="text-[10px] font-medium uppercase block mb-2" style={labelStyle}>
                  Name *
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

              {/* Phone */}
              <div>
                <label className="text-[10px] font-medium uppercase block mb-2" style={labelStyle}>
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full py-3 px-0 outline-none"
                  style={inputStyle}
                  placeholder="Contact number"
                />
              </div>

              {/* Email (optional) */}
              <div>
                <label className="text-[10px] font-medium uppercase block mb-2" style={labelStyle}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full py-3 px-0 outline-none"
                  style={inputStyle}
                  placeholder="Optional"
                />
              </div>

              {/* Branch */}
              {branchesData && branchesData.length > 0 && (
                <div>
                  <label className="text-[10px] font-medium uppercase block mb-2" style={labelStyle}>
                    Pickup Location *
                  </label>
                  <select
                    required
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: Number(e.target.value), time: "" })}
                    className="w-full py-3 px-0 outline-none appearance-none"
                    style={inputStyle}
                  >
                    <option value={0} disabled>
                      Select a location
                    </option>
                    {branchesData.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="text-[10px] font-medium uppercase block mb-2" style={labelStyle}>
                  Pickup Date *
                </label>
                <input
                  type="date"
                  required
                  min={minDate}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })}
                  className="w-full py-3 px-0 outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Time Slot */}
              {slotsData && slotsData.slots.length > 0 && (
                <div>
                  <label className="text-[10px] font-medium uppercase block mb-2" style={labelStyle}>
                    Pickup Time *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {slotsData.slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setForm({ ...form, time: slot.time })}
                        className="py-2 px-4 text-xs transition-all duration-300"
                        style={{
                          fontFamily: "var(--font-body)",
                          letterSpacing: "0.05em",
                          border: form.time === slot.time
                            ? "1px solid oklch(0.34 0.05 45)"
                            : "1px solid oklch(0.84 0.025 72)",
                          backgroundColor: form.time === slot.time
                            ? "oklch(0.34 0.05 45)"
                            : "transparent",
                          color: !slot.available
                            ? "oklch(0.34 0.05 45 / 0.2)"
                            : form.time === slot.time
                            ? "oklch(0.94 0.015 80)"
                            : "oklch(0.34 0.05 45 / 0.7)",
                          opacity: slot.available ? 1 : 0.4,
                          cursor: slot.available ? "pointer" : "not-allowed",
                        }}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                  {slotsLoading && (
                    <p className="text-xs mt-2" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.4)" }}>
                      Loading available times...
                    </p>
                  )}
                </div>
              )}

              {/* Cake Type */}
              <div>
                <label className="text-[10px] font-medium uppercase block mb-2" style={labelStyle}>
                  Cake Type *
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
                  {cakeTypeOptions.map((cake) => (
                    <option key={cake.name} value={cake.name}>
                      {cake.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Request */}
              <div>
                <label className="text-[10px] font-medium uppercase block mb-2" style={labelStyle}>
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
                  disabled={submitMutation.isPending}
                  className="text-[10px] font-medium uppercase py-3 px-10 transition-all duration-400 hover:opacity-70 disabled:opacity-40"
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.2em",
                    backgroundColor: "oklch(0.34 0.05 45)",
                    color: "oklch(0.94 0.015 80)",
                  }}
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Booking"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
