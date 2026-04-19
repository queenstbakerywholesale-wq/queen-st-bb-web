/**
 * Home — 4 full-screen scrolling sections inspired by Miu Miu
 * Design: "Atelier Dolce" — cinematic framing, warm materiality, narrative sequencing
 * Each section is a full-viewport "scene" with editorial imagery and minimal text overlay
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";

const IMAGES = {
  main: "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-main-DCvSGXsexKPMwmhrmBHewa.webp",
  tiramisu: "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-tiramisu-5h2ZTWStaR9kXHw97oAsV7.webp",
  gelato: "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-gelato-bSnt8m7kGiDFqrvhPfDkmW.webp",
  space: "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-space-d9F8XM8hZ4d35LsKJG8x5i.webp",
};

interface Section {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
}

const sections: Section[] = [
  {
    id: "hero",
    title: "Queen St BB",
    subtitle: "An Italian Atelier of Desserts",
    image: IMAGES.main,
    href: "/about",
  },
  {
    id: "tiramisu",
    title: "Tiramisu",
    subtitle: "The art of layered indulgence",
    image: IMAGES.tiramisu,
    href: "/tiramisu",
  },
  {
    id: "gelato",
    title: "Gelato",
    subtitle: "Crafted from tradition, served with intention",
    image: IMAGES.gelato,
    href: "/gelato",
  },
  {
    id: "space",
    title: "The Space",
    subtitle: "Where craft meets ceremony",
    image: IMAGES.space,
    href: "/space",
  },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollToSection = useCallback(
    (index: number) => {
      if (isScrolling || index < 0 || index >= sections.length) return;
      setIsScrolling(true);
      setCurrentSection(index);
      setTimeout(() => setIsScrolling(false), 900);
    },
    [isScrolling]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastScrollTime = 0;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime < 900) return;
      lastScrollTime = now;

      if (e.deltaY > 0) {
        scrollToSection(currentSection + 1);
      } else {
        scrollToSection(currentSection - 1);
      }
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

      {/* Sections Container */}
      <div ref={containerRef} className="h-screen overflow-hidden">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="h-screen w-full absolute inset-0 overflow-hidden"
            style={{
              transform: `translateY(${(index - currentSection) * 100}%)`,
              transition: "transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)",
              zIndex: currentSection === index ? 10 : 1,
            }}
          >
            {/* Background Image with Ken Burns */}
            <div className="absolute inset-0 film-grain">
              <motion.div
                className="absolute inset-0"
                animate={{
                  scale: currentSection === index ? 1.05 : 1,
                }}
                transition={{ duration: 12, ease: "linear" }}
              >
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 md:pb-32 z-10">
              <AnimatePresence mode="wait">
                {currentSection === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-center"
                  >
                    {index === 0 ? (
                      <>
                        <h1
                          className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-editorial mb-4"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          Queen St BB
                        </h1>
                        <p
                          className="text-[11px] md:text-[13px] font-light text-white/70 uppercase tracking-editorial"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {section.subtitle}
                        </p>
                      </>
                    ) : (
                      <Link href={section.href}>
                        <div className="group">
                          <h2
                            className="text-3xl md:text-5xl lg:text-6xl font-light text-white tracking-wide-editorial mb-3 group-hover:opacity-80 transition-opacity duration-300"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {section.title}
                          </h2>
                          <p
                            className="text-[11px] md:text-[13px] font-light text-white/60 uppercase tracking-editorial"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            {section.subtitle}
                          </p>
                          <div className="flex justify-center mt-6">
                            <span
                              className="text-[10px] font-medium text-white/50 uppercase tracking-editorial border-b border-white/30 pb-1 group-hover:text-white/80 group-hover:border-white/60 transition-all duration-300"
                              style={{ fontFamily: "var(--font-body)" }}
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

      {/* Pagination Indicator */}
      <div className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className="group flex items-center gap-2"
            aria-label={`Go to section ${index + 1}`}
          >
            <motion.div
              className="w-[2px] bg-white/40 transition-all duration-300"
              animate={{
                height: currentSection === index ? 32 : 12,
                backgroundColor:
                  currentSection === index
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.3)",
              }}
              transition={{ duration: 0.4 }}
            />
          </button>
        ))}
      </div>

      {/* Section Counter */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
        <span
          className="text-[11px] font-light text-white/50 tracking-editorial"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {String(currentSection + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}
        </span>
      </div>

      {/* Scroll hint on first section */}
      <AnimatePresence>
        {currentSection === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
          >
            <span
              className="text-[10px] font-light text-white/40 uppercase tracking-editorial"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-[1px] h-4 bg-white/30"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
