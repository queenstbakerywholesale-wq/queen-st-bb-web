/**
 * NotFound — Editorial 404 page
 * Typography: Playfair Display 500, Inter 400-500
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "oklch(0.94 0.015 80)" }}
    >
      <Navigation variant="solid" />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span
            className="text-[11px] uppercase block mb-6"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: "oklch(0.45 0.06 45 / 0.5)",
            }}
          >
            Page Not Found
          </span>
          <h1
            className="text-6xl md:text-8xl mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              letterSpacing: "0.01em",
              lineHeight: 1.1,
              color: "oklch(0.34 0.05 45)",
            }}
          >
            404
          </h1>
          <p
            className="text-base mb-10 max-w-md mx-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              lineHeight: 1.65,
              color: "oklch(0.34 0.05 45 / 0.6)",
            }}
          >
            The page you are looking for has been moved, removed, or perhaps
            never existed.
          </p>
          <div className="editorial-rule mx-auto mb-10" />
          <Link href="/">
            <span
              className="text-[11px] uppercase py-3 px-8 inline-block transition-all duration-400 hover:opacity-70"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                backgroundColor: "oklch(0.34 0.05 45)",
                color: "oklch(0.94 0.015 80)",
              }}
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
