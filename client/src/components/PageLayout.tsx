/**
 * PageLayout — Editorial page wrapper for inner pages
 * Palette: brand-brown #5A3A2E, parchment, cocoa, linen
 * Immersive hero with matte overlay, warm tones throughout
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen"
      style={{ backgroundColor: "oklch(0.94 0.015 80)" }}
    >
      <Navigation variant="transparent" />

      {/* Hero Section — cinematic, immersive */}
      <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        <motion.div
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={heroImage}
            alt={heroTitle}
            className="w-full h-full object-cover"
            style={{ filter: "saturate(0.85) contrast(0.95)" }}
          />
        </motion.div>
        {/* Matte warm overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, oklch(0.15 0.03 45 / 0.55) 0%, oklch(0.2 0.02 45 / 0.2) 40%, transparent 70%)",
          }}
        />
        {/* Subtle grain */}
        <div className="absolute inset-0 film-grain" />

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-14 md:pb-20 z-10">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-center"
          >
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-light text-white mb-2"
              style={{
                fontFamily: "var(--font-display)",
                letterSpacing: "0.12em",
              }}
            >
              {heroTitle}
            </h1>
            {heroSubtitle && (
              <p
                className="text-[10px] md:text-[12px] font-light uppercase"
                style={{
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.5)",
                }}
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
