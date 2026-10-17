import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";

const navLinks = [
  { label: "Tiramisu", href: "/tiramisu" },
  { label: "Gelato", href: "/gelato" },
  { label: "Space", href: "/space" },
  { label: "Objects", href: "/objects" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "Franchise", href: "/franchise" },
  { label: "Cake Booking", href: "/cake-booking" },
  { label: "Gift Cards", href: "/gift-cards" },
];

const desktopLeft = navLinks.slice(0, 4);
const desktopRight = navLinks.slice(6, 8);
const baseAllLinks = [...navLinks, { label: "About", href: "/about" }, { label: "Customer Care", href: "/customer-care" }];

interface NavigationProps { variant?: "transparent" | "solid"; }

export default function Navigation({ variant = "solid" }: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const allLinks = useMemo(() => isAuthenticated ? [...baseAllLinks, { label: "My Page", href: "/my-page" }] : baseAllLinks, [isAuthenticated]);
  const isTransparent = variant === "transparent";
  const showSolid = !isTransparent || scrolled || menuOpen;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkColor = menuOpen ? "rgba(255,255,255,0.78)" : showSolid ? "oklch(0.34 0.05 45 / 0.72)" : "rgba(255,255,255,0.88)";

  return (
    <>
      <div className={`fixed left-0 right-0 top-0 z-[60] text-center transition-colors duration-300 ${showSolid ? "bg-[#3d2c24] text-[#f7eee2]" : "bg-[#3d2c24]/70 text-white"}`}>
        <p className="px-4 py-2 text-[9px] uppercase tracking-[0.18em]">Fresh tiramisu daily · Melbourne CBD, Hawthorn & Windsor coming soon</p>
      </div>
      <header
        className="fixed left-0 right-0 top-[29px] z-50 border-b transition-colors duration-300"
        style={{
          backgroundColor: menuOpen ? "#3d2c24" : showSolid ? "rgba(247,238,226,0.96)" : "transparent",
          backdropFilter: showSolid && !menuOpen ? "blur(8px)" : "none",
          borderColor: showSolid && !menuOpen ? "rgba(126,96,75,0.22)" : "transparent",
        }}
      >
        <div className="hidden items-center justify-between px-6 py-4 lg:flex xl:px-10">
          <nav className="flex min-w-[330px] items-center gap-6">
            {desktopLeft.map((link) => <NavItem key={link.href} link={link} location={location} color={linkColor} />)}
          </nav>
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <span className="font-serif text-xl tracking-[0.08em]" style={{ color: menuOpen ? "#fffaf2" : showSolid ? "#3d2c24" : "#fffaf2" }}>QUEEN ST BB</span>
          </Link>
          <nav className="flex min-w-[330px] items-center justify-end gap-6">
            {desktopRight.map((link) => <NavItem key={link.href} link={link} location={location} color={linkColor} />)}
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" className="ml-2 flex flex-col gap-1.5">
              <span className="block h-px w-6" style={{ backgroundColor: menuOpen ? "#fffaf2" : showSolid ? "#3d2c24" : "#fffaf2" }} />
              <span className="block h-px w-4 self-end" style={{ backgroundColor: menuOpen ? "#fffaf2" : showSolid ? "#3d2c24" : "#fffaf2" }} />
              <span className="block h-px w-6" style={{ backgroundColor: menuOpen ? "#fffaf2" : showSolid ? "#3d2c24" : "#fffaf2" }} />
            </button>
          </nav>
        </div>
        <div className="flex items-center justify-between px-5 py-4 lg:hidden">
          <Link href="/"><span className="font-serif text-lg tracking-[0.08em]" style={{ color: menuOpen ? "#fffaf2" : showSolid ? "#3d2c24" : "#fffaf2" }}>QUEEN ST BB</span></Link>
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="relative z-10 flex flex-col items-end gap-1.5">
            <span className="block h-px w-6" style={{ backgroundColor: menuOpen ? "#fffaf2" : showSolid ? "#3d2c24" : "#fffaf2" }} />
            <span className="block h-px w-4" style={{ backgroundColor: menuOpen ? "#fffaf2" : showSolid ? "#3d2c24" : "#fffaf2" }} />
            <span className="block h-px w-6" style={{ backgroundColor: menuOpen ? "#fffaf2" : showSolid ? "#3d2c24" : "#fffaf2" }} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-[#3d2c24] px-8 pt-20">
            <nav className="grid w-full max-w-xl grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
              {allLinks.map((link, i) => (
                <motion.div key={link.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}>
                  <Link href={link.href} onClick={() => setMenuOpen(false)}>
                    <span className={`font-serif text-2xl italic transition-opacity hover:opacity-50 ${location === link.href ? "text-[#d9b27f]" : "text-[#fffaf2]"}`}>{link.label}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavItem({ link, location, color }: { link: { label: string; href: string }; location: string; color: string }) {
  return <Link href={link.href}><span className="text-[10px] uppercase tracking-[0.08em] transition-opacity hover:opacity-50" style={{ color: location === link.href ? "#3d2c24" : color }}>{link.label}</span></Link>;
}
