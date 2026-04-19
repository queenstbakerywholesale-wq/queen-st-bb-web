/**
 * NotFound — Editorial 404 page
 * Palette: brand-brown, parchment, cocoa
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
            className="text-[10px] font-medium uppercase block mb-6"
            style={{
              fontFamily: "var(--font-body)",
              letterSpacing: "0.2em",
              color: "oklch(0.45 0.06 45 / 0.5)",
            }}
          >
            Page Not Found
          </span>
          <h1
            className="text-6xl md:text-8xl font-light mb-6"
            style={{
              fontFamily: "var(--font-display)",
              color: "oklch(0.34 0.05 45)",
            }}
          >
            404
          </h1>
          <p
            className="text-base font-light mb-10 max-w-md mx-auto"
            style={{
              fontFamily: "var(--font-body)",
              color: "oklch(0.34 0.05 45 / 0.55)",
            }}
          >
            The page you are looking for has been moved, removed, or perhaps
            never existed.
          </p>
          <div className="editorial-rule mx-auto mb-10" />
          <Link href="/">
            <span
              className="text-[10px] font-medium uppercase py-3 px-8 inline-block transition-all duration-400 hover:opacity-70"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.2em",
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
