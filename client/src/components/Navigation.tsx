/**
 * Navigation — Luxury editorial header
 * Typography: Inter weight 500, tight letter-spacing
 * Brand wordmark: Playfair Display weight 500
 * Pure white text over images, no opacity reduction
 */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Tiramisu", href: "/tiramisu" },
  { label: "Gelato", href: "/gelato" },
  { label: "Space", href: "/space" },
  { label: "Objects", href: "/objects" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "Cake Booking", href: "/cake-booking" },
];

const allLinks = [
  ...navLinks,
  { label: "About", href: "/about" },
  { label: "Customer Care", href: "/customer-care" },
];

interface NavigationProps {
  variant?: "transparent" | "solid";
}

export default function Navigation({ variant = "solid" }: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  const isTransparent = variant === "transparent";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const showSolid = !isTransparent || scrolled || menuOpen;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-700"
        style={{
          backgroundColor: menuOpen
            ? "oklch(0.30 0.04 45)"
            : showSolid
              ? "oklch(0.94 0.015 80 / 0.96)"
              : "transparent",
          backdropFilter: showSolid && !menuOpen ? "blur(8px)" : "none",
          borderBottom: showSolid && !menuOpen
            ? "1px solid oklch(0.84 0.025 72 / 0.5)"
            : "1px solid transparent",
        }}
      >
        <div className="flex items-center justify-between px-6 md:px-10 py-4 md:py-5">
          {/* Brand Wordmark — Playfair Display, weight 500 */}
          <Link href="/">
            <span
              className="text-lg md:text-xl transition-colors duration-500"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: menuOpen
                  ? "#FFFFFF"
                  : showSolid
                    ? "oklch(0.34 0.05 45)"
                    : "#FFFFFF",
              }}
            >
              QUEEN ST BB
            </span>
          </Link>

          {/* Desktop Nav — Inter, weight 500, sharp */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className="text-[11px] uppercase transition-all duration-400 hover:opacity-60"
                  style={{
                    fontFamily: "var(--font-nav)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    color: menuOpen
                      ? "rgba(255,255,255,0.7)"
                      : showSolid
                        ? location === link.href
                          ? "oklch(0.34 0.05 45)"
                          : "oklch(0.34 0.05 45 / 0.65)"
                        : location === link.href
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.85)",
                  }}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Menu Toggle — three thin lines */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative z-60 flex flex-col items-end gap-[5px]"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              className="block w-6 h-[1px] origin-center"
              style={{
                backgroundColor: menuOpen
                  ? "#FFFFFF"
                  : showSolid
                    ? "oklch(0.34 0.05 45)"
                    : "#FFFFFF",
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-4 h-[1px]"
              style={{
                backgroundColor: showSolid
                  ? "oklch(0.34 0.05 45)"
                  : "#FFFFFF",
              }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              className="block w-6 h-[1px] origin-center"
              style={{
                backgroundColor: menuOpen
                  ? "#FFFFFF"
                  : showSolid
                    ? "oklch(0.34 0.05 45)"
                    : "#FFFFFF",
              }}
              transition={{ duration: 0.3 }}
            />
          </button>
        </div>
      </header>

      {/* Full-screen Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ backgroundColor: "oklch(0.30 0.04 45)" }}
          >
            <nav className="flex flex-col items-center gap-5 md:gap-7">
              {allLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <Link href={link.href} onClick={() => setMenuOpen(false)}>
                    <span
                      className="text-2xl md:text-3xl transition-opacity duration-300 hover:opacity-40"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 500,
                        letterSpacing: "0.01em",
                        color:
                          location === link.href
                            ? "oklch(0.82 0.04 72)"
                            : "#FFFFFF",
                      }}
                    >
                      {link.label}
                    </span>
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-4 h-[1px] w-12"
                style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
              />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
