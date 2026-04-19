/**
 * PageLayout — Reusable editorial page wrapper for inner pages
 * Design: "Atelier Dolce" — hero section with image, editorial content area, footer
 */
import { ReactNode, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import Navigation from "./Navigation";
import Footer from "./Footer";

interface PageLayoutProps {
  heroImage: string;
  heroTitle: string;
  heroSubtitle?: string;
  children: ReactNode;
}

export default function PageLayout({
  heroImage,
  heroTitle,
  heroSubtitle,
  children,
}: PageLayoutProps) {
  const [location] = useLocation();

  // Scroll to top on page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-ivory"
    >
      <Navigation variant="transparent" />

      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[80vh] overflow-hidden film-grain">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={heroImage}
            alt={heroTitle}
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 md:pb-24 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-center"
          >
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-wide-editorial mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {heroTitle}
            </h1>
            {heroSubtitle && (
              <p
                className="text-[11px] md:text-[13px] font-light text-white/60 uppercase tracking-editorial"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {heroSubtitle}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <main>{children}</main>

      <Footer />
    </motion.div>
  );
}
