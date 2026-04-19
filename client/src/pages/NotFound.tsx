/**
 * NotFound — Editorial 404 page
 * Design: "Atelier Dolce" — minimal, warm, editorial
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Navigation variant="solid" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span
            className="text-[11px] font-medium uppercase tracking-editorial text-terracotta block mb-6"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Page Not Found
          </span>
          <h1
            className="text-6xl md:text-8xl font-light text-espresso mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            404
          </h1>
          <p
            className="text-base font-light text-espresso/60 mb-10 max-w-md mx-auto"
            style={{ fontFamily: "var(--font-body)" }}
          >
            The page you are looking for has been moved, removed, or perhaps
            never existed.
          </p>
          <div className="editorial-rule mx-auto mb-10" />
          <Link href="/">
            <span
              className="text-[11px] font-medium uppercase tracking-editorial text-espresso border border-espresso/30 px-8 py-3 hover:bg-espresso hover:text-ivory transition-all duration-300 inline-block"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Return Home
            </span>
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
