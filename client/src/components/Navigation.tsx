/**
 * Navigation — Minimal editorial header inspired by Miu Miu
 * Design: "Atelier Dolce" — thin serif brand name, uppercase nav links with editorial tracking
 * Transparent overlay on homepage, solid on inner pages
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
    if (variant !== "transparent") return;
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [variant]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isTransparent && !menuOpen && !scrolled
            ? "bg-transparent"
            : "bg-ivory/95 backdrop-blur-sm shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between px-6 md:px-10 py-5">
          {/* Brand Name */}
          <Link href="/">
            <span
              className={`font-[var(--font-display)] text-xl md:text-2xl font-light tracking-editorial transition-colors duration-300 ${
                isTransparent && !menuOpen && !scrolled ? "text-white" : "text-espresso"
              }`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              QUEEN ST BB
            </span>
          </Link>

          {/* Desktop Nav — hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.slice(0, 6).map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`font-[var(--font-body)] text-[11px] font-medium uppercase tracking-editorial transition-all duration-300 hover:opacity-60 ${
                    isTransparent && !scrolled
                      ? "text-white/90"
                      : "text-espresso/80"
                  } ${location === link.href ? "opacity-100" : ""}`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Menu Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`relative z-60 flex flex-col items-end gap-[5px] transition-colors duration-300 ${
              menuOpen ? "text-espresso" : isTransparent && !scrolled ? "text-white" : "text-espresso"
            }`}
            aria-label="Toggle menu"
          >
            <motion.span
              animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              className="block w-6 h-[1px] bg-current origin-center"
              transition={{ duration: 0.3 }}
            />
            <motion.span
              animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-4 h-[1px] bg-current"
              transition={{ duration: 0.2 }}
            />
            <motion.span
              animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              className="block w-6 h-[1px] bg-current origin-center"
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
            className="fixed inset-0 z-40 bg-ivory flex items-center justify-center"
          >
            <nav className="flex flex-col items-center gap-6 md:gap-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <Link href={link.href} onClick={() => setMenuOpen(false)}>
                    <span
                      className={`font-light text-3xl md:text-4xl tracking-wide-editorial transition-opacity duration-300 hover:opacity-50 ${
                        location === link.href
                          ? "text-terracotta"
                          : "text-espresso"
                      }`}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {link.label}
                    </span>
                  </Link>
                </motion.div>
              ))}

              {/* Decorative rule */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="editorial-rule mt-4"
              />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
