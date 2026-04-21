/**
 * Home — 4 full-screen scrolling sections
 * Palette: brand-brown #5A3A2E, cream #D8C3A8, matte tones
 * Cinematic, immersive, editorial — like a luxury brand story
 * Minimal text, strong visual focus
 */
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { usePageImages } from "@/hooks/usePageImage";

const DEFAULT_IMAGES = {
  "hero-main": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-main-DCvSGXsexKPMwmhrmBHewa.webp",
  "hero-tiramisu": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-tiramisu-5h2ZTWStaR9kXHw97oAsV7.webp",
  "hero-gelato": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-gelato-bSnt8m7kGiDFqrvhPfDkmW.webp",
  "hero-space": "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-space-d9F8XM8hZ4d35LsKJG8x5i.webp",
};

interface Section {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
}



export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const images = usePageImages("home", DEFAULT_IMAGES);

  const sections: Section[] = useMemo(() => [
    {
      id: "hero",
      title: "Queen St BB",
      subtitle: "A dessert atelier",
      image: images["hero-main"],
      href: "/about",
    },
    {
      id: "tiramisu",
      title: "Tiramisu",
      subtitle: "Layered with intention",
      image: images["hero-tiramisu"],
      href: "/tiramisu",
    },
    {
      id: "gelato",
      title: "Gelato",
      subtitle: "Crafted from tradition",
      image: images["hero-gelato"],
      href: "/gelato",
    },
    {
      id: "space",
      title: "The Space",
      subtitle: "Where craft meets ceremony",
      image: images["hero-space"],
      href: "/space",
    },
  ], [images]);

  const scrollToSection = useCallback(
    (index: number) => {
      if (isScrolling || index < 0 || index >= sections.length) return;
      setIsScrolling(true);
      setCurrentSection(index);
      setTimeout(() => setIsScrolling(false), 1000);
    },
    [isScrolling, sections.length]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastScrollTime = 0;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime < 1000) return;
      lastScrollTime = now;

      if (e.deltaY > 0) scrollToSection(currentSection + 1);
      else scrollToSection(currentSection - 1);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [currentSection, scrollToSection]);

  // Touch support
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) {
        if (diff > 0) scrollToSection(currentSection + 1);
        else scrollToSection(currentSection - 1);
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentSection, scrollToSection]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        scrollToSection(currentSection + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollToSection(currentSection - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSection, scrollToSection]);

  return (
    <div className="h-screen overflow-hidden relative">
      <Navigation variant="transparent" />

      {/* Sections */}
      <div ref={containerRef} className="h-screen overflow-hidden">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="h-screen w-full absolute inset-0 overflow-hidden"
            style={{
              transform: `translateY(${(index - currentSection) * 100}%)`,
              transition: "transform 0.9s cubic-bezier(0.65, 0, 0.35, 1)",
              zIndex: currentSection === index ? 10 : 1,
            }}
          >
            {/* Background Image — slow Ken Burns */}
            <div className="absolute inset-0">
              <motion.div
                className="absolute inset-0"
                animate={{
                  scale: currentSection === index ? 1.04 : 1,
                }}
                transition={{ duration: 14, ease: "linear" }}
              >
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full h-full object-cover"
                  style={{ filter: "saturate(0.85) contrast(0.95)" }}
                />
              </motion.div>
              {/* Matte dark overlay — desaturated, warm */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, oklch(0.15 0.03 45 / 0.65) 0%, oklch(0.2 0.02 45 / 0.25) 40%, transparent 70%)",
                }}
              />
              {/* Subtle grain */}
              <div className="absolute inset-0 film-grain" />
            </div>

            {/* Content Overlay — minimal text */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 md:pb-28 z-10">
              <AnimatePresence mode="wait">
                {currentSection === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.7, delay: 0.25 }}
                    className="text-center"
                  >
                    {index === 0 ? (
                      <>
                        <h1
                          className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-3"
                          style={{
                            fontFamily: "var(--font-display)",
                            letterSpacing: "0.15em",
                          }}
                        >
                          Queen St BB
                        </h1>
                        <p
                          className="text-[10px] md:text-[12px] font-light uppercase"
                          style={{
                            fontFamily: "var(--font-body)",
                            letterSpacing: "0.25em",
                            color: "rgba(255,255,255,0.55)",
                          }}
                        >
                          {section.subtitle}
                        </p>
                      </>
                    ) : (
                      <Link href={section.href}>
                        <div className="group">
                          <h2
                            className="text-3xl md:text-5xl lg:text-6xl font-light text-white mb-2 group-hover:opacity-75 transition-opacity duration-500"
                            style={{
                              fontFamily: "var(--font-display)",
                              letterSpacing: "0.12em",
                            }}
                          >
                            {section.title}
                          </h2>
                          <p
                            className="text-[10px] md:text-[12px] font-light uppercase"
                            style={{
                              fontFamily: "var(--font-body)",
                              letterSpacing: "0.2em",
                              color: "rgba(255,255,255,0.45)",
                            }}
                          >
                            {section.subtitle}
                          </p>
                          <div className="flex justify-center mt-5">
                            <span
                              className="text-[9px] font-medium uppercase pb-1 group-hover:opacity-80 transition-all duration-400"
                              style={{
                                fontFamily: "var(--font-body)",
                                letterSpacing: "0.2em",
                                color: "rgba(255,255,255,0.4)",
                                borderBottom: "1px solid rgba(255,255,255,0.2)",
                              }}
                            >
                              Explore
                            </span>
                          </div>
                        </div>
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination — thin vertical lines */}
      <div className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className="group flex items-center"
            aria-label={`Go to section ${index + 1}`}
          >
            <motion.div
              className="w-[1.5px] transition-all duration-500"
              animate={{
                height: currentSection === index ? 28 : 10,
                backgroundColor:
                  currentSection === index
                    ? "rgba(255,255,255,0.85)"
                    : "rgba(255,255,255,0.25)",
              }}
              transition={{ duration: 0.5 }}
            />
          </button>
        ))}
      </div>

      {/* Section Counter */}
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-30">
        <span
          className="text-[10px] font-light"
          style={{
            fontFamily: "var(--font-body)",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {String(currentSection + 1).padStart(2, "0")} /{" "}
          {String(sections.length).padStart(2, "0")}
        </span>
      </div>

      {/* Scroll hint — first section only */}
      <AnimatePresence>
        {currentSection === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2, duration: 0.6 }}
            className="fixed bottom-14 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
          >
            <span
              className="text-[9px] font-light uppercase"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="w-[1px] h-4"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
