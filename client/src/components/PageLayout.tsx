/**
 * PageLayout — Luxury editorial page wrapper for inner pages
 * Typography: Playfair Display 500 for hero headings, Inter 500 for subtitles
 * Pure white text over images, no opacity reduction on headings
 * Larger, more impactful hero type with tight letter-spacing
 */
import { ReactNode, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import Navigation from "./Navigation";
import Footer from "./Footer";
import ProgressiveImage from "./ProgressiveImage";

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
          <ProgressiveImage
            src={heroImage}
            alt={heroTitle}
            containerClassName="w-full h-full"
            className="saturate-[0.85] contrast-[0.95]"
          />
        </motion.div>
        {/* Slightly darker overlay for strong text contrast */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, oklch(0.12 0.03 45 / 0.65) 0%, oklch(0.18 0.02 45 / 0.3) 40%, oklch(0.2 0.01 45 / 0.1) 70%)",
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
              className="text-4xl md:text-6xl lg:text-7xl mb-3"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                letterSpacing: "0.01em",
                lineHeight: 1.1,
                color: "#FFFFFF",
              }}
            >
              {heroTitle}
            </h1>
            {heroSubtitle && (
              <p
                className="text-xs md:text-sm uppercase"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  color: "#FFFFFF",
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
